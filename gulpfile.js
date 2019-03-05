const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');

let envOptions = {
  string: 'env',
  default: { env: 'develop' }
};

const options = minimist(process.argv.slice(2), envOptions);

function clean(done) {
  return gulp.src(['./.tmp', './public'], { read: false }).pipe($.clean());
  done();
}

function jade(done) {
  gulp
    .src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe(
      $.data(function() {
        const aa = require('./source/data/aa.json');
        const bb = require('./source/data/bb.json');
        const data = {
          aa,
          bb
        };
        return data;
      })
    )
    .pipe(
      $.jade({
        pretty: true
      })
    )
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream());
  done();
}

function sass(done) {
  const plugins = [autoprefixer({ browsers: ['last 3 version', '> 5%'] })];
  return gulp
    .src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe(
      $.sass({
        includePaths: ['./node_modules/bootstrap/scss']
      }).on('error', $.sass.logError)
    )
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'production', $.cleanCss()))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
  done();
}

function babel(done) {
  gulp
    .src('./source/js/**/*.js')
    .pipe(
      $.babel({
        presets: ['@babel/env']
      })
    )
    .pipe($.concat('all.js'))
    .pipe(
      $.if(
        options.env === 'production',
        $.uglify({
          compress: {
            drop_console: true
          }
        })
      )
    )
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream());
  done();
}

function bower() {
  return gulp.src(mainBowerFiles()).pipe(gulp.dest('./.tmp/vendors'));
}

// bower後面
function vendorsJs() {
  return gulp
    .src('./.tmp/vendors/**/*.js')
    .pipe($.concat('vendors.js'))
    .pipe($.if(options.env === 'production', $.uglify()))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream());
}

function browserSyncServer() {
  browserSync.init({
    server: {
      baseDir: './public'
    },
    reloadDebounce: 2000
  });
}

function imageMin(done) {
  gulp
    .src('./source/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'));
  done();
}

function watch() {
  gulp.watch('./source/scss/**/*.scss', sass);
  gulp.watch('./source/**/*.jade', jade);
  gulp.watch('./source/js/**/*.js', babel);
}

function deploy() {
  return gulp.src('./public/**/*').pipe($.ghPages());
}

const vendors = gulp.series(bower, vendorsJs);

const build = gulp.series(
  clean,
  gulp.parallel(jade, sass, babel, imageMin, vendors)
);

const serve = gulp.parallel(
  jade,
  sass,
  babel,
  imageMin,
  vendors,
  browserSyncServer,
  watch
);

exports.clean = clean;

exports.jade = jade;
exports.sass = sass;
exports.babel = babel;
exports.imageMin = imageMin;
exports.vendors = vendors;

exports.browserSyncServer = browserSyncServer;
exports.watch = watch;

exports.deploy = deploy;

exports.build = build;
exports.default = serve;
