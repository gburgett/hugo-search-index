const gulp = require('gulp')
const cp = require('child_process')

// import the task provided by the "hugo-search-index" library
// we pass the console so that the task can write debug information
require('hugo-search-index/gulp')(gulp, console)

const hugoBin = "hugo";
const defaultArgs = ["-v"];

gulp.task("default", ["build"]);

/** 
 * "build" relies on "hugo" and "hugo-search-index".
 * "hugo" is defined further down, and runs the hugo binary to create the site.
 * "hugo-search-index" is imported from 'hugo-search-index/gulp' above.
 */
gulp.task("build", ["hugo", "hugo-search-index"]);

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

