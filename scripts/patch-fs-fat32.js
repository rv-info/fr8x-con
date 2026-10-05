/**
 * scripts/patch-fs-fat32.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Transparent Windows FAT32 / exFAT compatibility shim for Node.js & Webpack.
 * On FAT32 volumes, libuv maps Windows non-symlink reparse errors to EISDIR
 * instead of EINVAL. This shim normalizes EISDIR on readlink to EINVAL,
 * allowing Next.js / Webpack symlink checks to behave identically to NTFS/Linux.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');

if (process.platform === 'win32') {
  const origReadlink = fs.readlink;
  const origReadlinkSync = fs.readlinkSync;
  const origPromisesReadlink = fs.promises ? fs.promises.readlink : null;

  fs.readlink = function (path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    origReadlink.call(fs, path, options, (err, linkString) => {
      if (err && err.code === 'EISDIR') {
        const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        einval.code = 'EINVAL';
        einval.errno = -4071;
        einval.syscall = 'readlink';
        einval.path = path;
        return callback(einval);
      }
      return callback(err, linkString);
    });
  };

  fs.readlinkSync = function (path, options) {
    try {
      return origReadlinkSync.call(fs, path, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        einval.code = 'EINVAL';
        einval.errno = -4071;
        einval.syscall = 'readlink';
        einval.path = path;
        throw einval;
      }
      throw err;
    }
  };

  if (origPromisesReadlink) {
    fs.promises.readlink = async function (path, options) {
      try {
        return await origPromisesReadlink.call(fs.promises, path, options);
      } catch (err) {
        if (err && err.code === 'EISDIR') {
          const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
          einval.code = 'EINVAL';
          einval.errno = -4071;
          einval.syscall = 'readlink';
          einval.path = path;
          throw einval;
        }
        throw err;
      }
    };
  }
}
