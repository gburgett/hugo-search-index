const gulp = require('gulp')
const cp = require('child_process')

// import search index tasks
require('hugo-search-index/gulp')(gulp, console)

const hugoBin = "hugo";
const defaultArgs = ["-v"];

gulp.task("default", ["build"]);

/** 
 * "build" relies on "hugo" and "search".
 * "hugo" is defined further down, and runs the hugo binary to create the site.
 * "search" is imported from 'hugo-search-index/gulp' above.
 */
gulp.task("build", ["hugo", "search"]);

/**
 * Cleans everything - in this case the ./public folder.
 */
gulp.task("clean", ["clean-hugo"]);

/**
 * hugo: runs the hugo binary to build the hugo site.
 */
gulp.task("hugo", (cb) => buildHugo(cb));

function buildHugo(cb, options) {
  const args = options ? defaultArgs.concat(options) : defaultArgs;

  return cp.spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      cb();
    } else {
      cb("Hugo build failed");
    }
  });
}

/**
 * clean-hugo: deletes hugo build output
 */
gulp.task("clean-hugo", (cb) => {
  remove('./public', cb).then(
    () => cb(),
    err => {
      cb(err)
    }
  )
})

