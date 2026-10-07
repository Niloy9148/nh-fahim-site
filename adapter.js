/*
  NH Fahim site — Supabase connection.

  The page talks to its data through three small interfaces (db, assets, user).
  This file provides them on top of Supabase, so the same page works on Vercel:
    db      -> table "docs"        (every section, service, project, gear item, brand…)
    assets  -> storage bucket "media" (uploaded photos and videos)
    user    -> Supabase login      (only emails listed in table "admins" can edit)

  Admin login: open  yoursite.com/#admin
  You normally never need to edit this file. Settings live in config.js.
*/
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var configured = cfg.supabaseUrl && cfg.supabaseAnonKey &&
    cfg.supabaseUrl.indexOf('YOUR-') < 0 && cfg.supabaseAnonKey.indexOf('YOUR-') < 0;
  if (!configured || !window.supabase || !window.supabase.createClient) {
    /* not set up yet: the page still shows with its built-in text */
    if (location.hash === '#admin') {
      document.addEventListener('DOMContentLoaded', function () {
        alertBox('Supabase is not connected yet. Put your Project URL and anon key in config.js, then redeploy.');
      });
    }
    return;
  }

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  var BUCKET = 'media';
  window.MEDIA_BASE = cfg.supabaseUrl.replace(/\/+$/, '') + '/storage/v1/object/public/' + BUCKET + '/';
  window.MAX_UPLOAD_MB = cfg.maxUploadMb || 50;

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function num(v) { return typeof v === 'number' ? v : 1e12; }
  function writeErr(e) {
    var m = String((e && (e.message || e.code)) || e);
    if (/row-level security|permission|42501|401|403|JWT/i.test(m)) return { code: 'invalid_argument', message: m };
    return { code: 'unavailable', message: m };
  }
  function uploadErr(e) {
    var m = String((e && (e.message || e.error)) || e), st = e && (e.statusCode || e.status);
    if (/maximum allowed size|too large|413/i.test(m) || String(st) === '413') return { code: 'too_large', message: m };
    if (/mime|type/i.test(m) && /not supported|invalid/i.test(m)) return { code: 'unsupported_type', message: m };
    if (/row-level security|permission|403|401|Unauthorized/i.test(m) || String(st) === '403') return { code: 'invalid_argument', message: m };
    return { code: 'upstream_error', message: m };
  }

  /* ---------- db: documents stored as rows (collection, id, data) ---------- */
  var listeners = {};
  function notify(col) { (listeners[col] || []).forEach(function (f) { f(); }); }
  function listen(col, run) {
    (listeners[col] = listeners[col] || []).push(run); run();
    return function () { listeners[col] = (listeners[col] || []).filter(function (f) { return f !== run; }); };
  }
  async function getRow(col, id) {
    var r = await sb.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle();
    if (r.error) throw writeErr(r.error);
    return r.data ? r.data.data : null;
  }
  async function putRow(col, id, data) {
    var r = await sb.from('docs').upsert({ collection: col, id: id, data: data, updated_at: new Date().toISOString() });
    if (r.error) throw writeErr(r.error);
    notify(col);
  }
  function docRef(col, id) {
    return {
      id: id,
      path: col + '/' + id,
      get: async function () { var d = await getRow(col, id); return { id: id, exists: !!d, data: function () { return d || undefined; }, metadata: {} }; },
      set: function (data) { return putRow(col, id, data); },
      update: async function (data) {
        var cur = await getRow(col, id);
        if (!cur) throw { code: 'invalid_argument', message: 'Document does not exist' };
        return putRow(col, id, Object.assign({}, cur, data));
      },
      delete: async function () {
        var r = await sb.from('docs').delete().eq('collection', col).eq('id', id);
        if (r.error) throw writeErr(r.error);
        notify(col);
      },
      onSnapshot: function (next, err) {
        return listen(col, async function () {
          try { var d = await getRow(col, id); next({ id: id, exists: !!d, data: function () { return d || undefined; }, metadata: {} }); }
          catch (e) { if (err) err(e); }
        });
      }
    };
  }
  function colRef(col, orderField) {
    return {
      path: col,
      orderBy: function (f) { return colRef(col, f); },
      doc: function (id) { return docRef(col, id || newId()); },
      add: async function (data) { var id = newId(); await putRow(col, id, data); return docRef(col, id); },
      onSnapshot: function (next, err) {
        return listen(col, async function () {
          try {
            var r = await sb.from('docs').select('id,data').eq('collection', col);
            if (r.error) throw writeErr(r.error);
            var rows = r.data || [];
            if (orderField) rows.sort(function (a, b) { return num(a.data && a.data[orderField]) - num(b.data && b.data[orderField]); });
            var docs = rows.map(function (row) { return { id: row.id, exists: true, data: function () { return row.data; }, metadata: {} }; });
            next({ docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: {} });
          } catch (e) { if (err) err(e); }
        });
      }
    };
  }
  var db = {
    doc: function (path) { var p = String(path).split('/'); return docRef(p.slice(0, -1).join('/'), p[p.length - 1]); },
    collection: function (path) { return colRef(String(path)); }
  };

  /* ---------- assets: files in the public "media" bucket ---------- */
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm' };
  var assets = {
    upload: async function (blob, opts) {
      var type = (opts && opts.type) || blob.type || 'application/octet-stream';
      var path = newId() + '.' + (EXT[type] || 'bin');
      var r = await sb.storage.from(BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
      if (r.error) throw uploadErr(r.error);
      return { id: path, url: window.MEDIA_BASE + path, sizeBytes: blob.size, contentType: type };
    },
    list: async function () {
      var r = await sb.storage.from(BUCKET).list('', { limit: 1000 });
      var files = r.data || [];
      var bytes = files.reduce(function (s, f) { return s + ((f.metadata && f.metadata.size) || 0); }, 0);
      return { assets: [], usage: { files: files.length, bytes: bytes, maxFiles: 100000, maxBytes: (cfg.storageLimitMb || 1024) * 1048576 } };
    },
    delete: async function (id) {
      var r = await sb.storage.from(BUCKET).remove([id]);
      if (r.error) throw uploadErr(r.error);
      return { deleted: true };
    }
  };

  /* ---------- user: signed-in admin? ---------- */
  var sessionP = sb.auth.getSession().then(function (r) { return (r.data && r.data.session) || null; }, function () { return null; });
  var adminP = sessionP.then(async function (s) {
    if (!s || !s.user || !s.user.email) return false;
    var r = await sb.from('admins').select('email').eq('email', s.user.email.toLowerCase()).maybeSingle();
    return !!(r.data && !r.error);
  });
  var user = {
    canEdit: function () { return adminP; },
    isOwner: function () { return adminP; },
    can: function () { return Promise.resolve(null); },
    id: function () { return sessionP.then(function (s) { return s ? s.user.id : null; }); },
    me: function () { return sessionP.then(function (s) { return { id: s ? s.user.id : null, name: '', email: s ? s.user.email : null, avatarUrl: '', color: '#E8422F', isOwner: false, canEdit: false }; }); },
    profiles: function () { return Promise.resolve({}); }
  };

  window.claude = {
    use: async function (name) {
      if (name === 'db') return db;
      if (name === 'user') return user;
      if (name === 'assets') return (await adminP) ? assets : null;
      return null;
    }
  };
  window.SITE_LOGOUT = async function () {
    try { await sb.auth.signOut(); } catch (e) {}
    location.hash = ''; location.reload();
  };

  /* ---------- /#admin : login screen ---------- */
  function alertBox(text) {
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:24px;z-index:999;max-width:520px;margin:0 auto;padding:14px 18px;border-radius:14px;background:#F2EEE6;color:#071012;font:600 14px/1.5 Manrope,system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.5)';
    box.textContent = text;
    document.body.appendChild(box);
  }
  function showLogin() {
    if (document.getElementById('adminLogin')) return;
    var wrap = document.createElement('div');
    wrap.id = 'adminLogin';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Admin login');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(4,9,10,.9);backdrop-filter:blur(8px)';
    wrap.innerHTML =
      '<form class="glass" style="width:100%;max-width:420px;border-radius:22px;padding:28px;display:flex;flex-direction:column;gap:14px">' +
      '<div style="font-family:var(--display);font-size:40px;line-height:1">Studio login</div>' +
      '<p style="margin:0;color:var(--muted);font-size:14px">Sign in with the admin email to open the dashboard.</p>' +
      '<div><label class="flabel" for="al-email">Email</label><input id="al-email" class="field" type="email" autocomplete="username" required></div>' +
      '<div><label class="flabel" for="al-pass">Password</label><input id="al-pass" class="field" type="password" autocomplete="current-password" required></div>' +
      '<p id="al-err" role="alert" style="margin:0;color:#FF8A7A;font-size:14px" hidden></p>' +
      '<button class="btn btn-red" type="submit" style="width:100%">Log in</button>' +
      '<a href="#" id="al-cancel" style="text-align:center;color:var(--muted);font-size:14px">Back to the site</a>' +
      '</form>';
    document.body.appendChild(wrap);
    var form = wrap.querySelector('form'), err = wrap.querySelector('#al-err'), btn = wrap.querySelector('button');
    wrap.querySelector('#al-cancel').addEventListener('click', function (e) { e.preventDefault(); wrap.remove(); history.replaceState(null, '', location.pathname); });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.hidden = true; btn.disabled = true; btn.textContent = 'Signing in…';
      var r = await sb.auth.signInWithPassword({ email: wrap.querySelector('#al-email').value.trim(), password: wrap.querySelector('#al-pass').value });
      if (r.error) {
        err.textContent = 'Email or password is wrong.'; err.hidden = false;
        btn.disabled = false; btn.textContent = 'Log in';
        return;
      }
      var ok = await sb.from('admins').select('email').eq('email', (r.data.user.email || '').toLowerCase()).maybeSingle();
      if (!ok.data) {
        await sb.auth.signOut();
        err.textContent = 'This account is not an admin. Add its email to the "admins" table in Supabase.'; err.hidden = false;
        btn.disabled = false; btn.textContent = 'Log in';
        return;
      }
      location.hash = 'dashboard'; location.reload();
    });
    setTimeout(function () { wrap.querySelector('#al-email').focus(); }, 50);
  }
  function route() {
    if (location.hash !== '#admin') return;
    adminP.then(function (isAdmin) {
      if (isAdmin) { location.hash = 'dashboard'; location.reload(); }
      else showLogin();
    });
  }
  window.addEventListener('hashchange', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else route();
})();
