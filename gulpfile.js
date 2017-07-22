const gulp = require('gulp')
const gutil = require('gulp-util')
const ts = require('gulp-typescript')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const debug = require('gulp-debug')
const del = require('del')
const webpack = require('webpack')

const tsproj = ts.createProject('tsconfig.json')

gulp.task('build', ['build-gulp', 'build-dist'])

gulp.task('build-gulp', () => {
  return gulp.src(['src/gulp/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'])
      .pipe(tsproj())
      .pipe(rename({
        extname: ".js"
      }))
      .pipe(gulp.dest('gulp'))
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

gulp.task('clean', () => del('gulp/**/*', 'dist/**/*'))