const gulp = require('gulp')
const gutil = require('gulp-util')
const ts = require('gulp-typescript')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const debug = require('gulp-debug')
const del = require('del')
const webpack = require('webpack')
const path = require('path')

const gulpProj = ts.createProject('tsconfig.json', {
  declaration: true,
  target: "es2015"     // can assume gulp tasks are run on a somewhat modern nodejs install
})

const libProj = ts.createProject('tsconfig.json', {
  declaration: true,
  target: "es3"        // can't guarantee the library files get loaded by a babel loader
})

gulp.task('default', ['build'])

gulp.task('build', ['build-gulp', 'build-lib', 'build-dist'])

gulp.task('build-gulp', (done) => {
  gulp.src(['src/gulp/**/*.ts', '!src/**/*.test.ts'])  // all ts files in the gulp folder excluding test
      .pipe(gulpProj()).on('error', done)
      .pipe(gulp.dest('gulp')).on('end', done)
})

gulp.task('build-lib', (done) => {
  gulp.src(['src/lib/**/*.ts', '!src/**/*.test.ts'])  // all ts files in the lib folder excluding test
        .pipe(debug())
        .pipe(libProj()).on('error', done)
        .pipe(gulp.dest('lib')).on('end', done)

})

gulp.task('build-dist', ['dist-webpack', 'dist-minify'])

const webpackConfig = require("./webpack.config")

gulp.task('dist-webpack', (done) => {
  webpack(webpackConfig, (err, stats) => {
    if(err){
      gutil.log("[webpack] " + err)
      done(err)
      return
    }
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));

    if (stats.hasErrors()){
      done("[webpack] Compilation errors!")
      return
    }

    done()
  })
})

gulp.task('dist-minify', ['dist-webpack'], () => 
  gulp.src(['dist/**/*.js', '!dist/**/*.min.js'])
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
)

gulp.task('watch', ['build'], () => 
  gulp.watch(['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'], ['build'])
)

gulp.task('clean', (done) => {
  del(['gulp/**', 'dist/**', 'lib/**'])
    .then((files) => {
      gutil.log(gutil.colors.green(`removed ${files.length} files`))
      gutil.log(gutil.colors.cyan(...files.map(f => path.relative(__dirname, f))))
      done()
    })
    .catch((reason) => {
      done(reason)
    })
})