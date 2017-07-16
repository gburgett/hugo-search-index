var gulp = require('gulp')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
var del = require('del')

const tsproj = ts.createProject('tsconfig.json')

gulp.task('build', ['build-gulp'])

gulp.task('build-gulp', () => {
  return gulp.src(['src/gulp/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'])
      .pipe(tsproj())
      .pipe(rename({
        extname: ".js"
      }))
      .pipe(gulp.dest('gulp'))
})

gulp.task('watch', ['build'], () => 
  gulp.watch(['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'], ['build'])
)

gulp.task('clean', () => del('gulp/**/*'))