const gulp = require('gulp')
const sass = require('gulp-sass')
const rename = require("gulp-rename")
const path = require('path')
const pkg = require('../package.json')
const name = pkg.name
const NODE_ENV = process.env.NODE_ENV

sass.compiler = require('node-sass')

gulp.task('sass', () => {
  return gulp.src(path.resolve(__dirname, '../lib/theme/index.scss'))
    .pipe(sass({ outputStyle: NODE_ENV === 'development' ? 'expanded' : 'compressed' }).on('error', sass.logError))
    .pipe(rename(path => { path.basename = NODE_ENV === 'development' ? name : name + '.min' }))
    .pipe(gulp.dest(path.resolve(__dirname, '../dist/theme')))
})

gulp.task('img', () => {
  return gulp.src(path.resolve(__dirname, '../lib/theme/**/*.{png,svg}'))
    .pipe(gulp.dest(path.resolve(__dirname, '../dist/theme')))
})

gulp.task('build', gulp.parallel('sass', 'img'))
