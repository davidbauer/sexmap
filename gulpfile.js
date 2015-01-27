// Node modules
var log         = require("npmlog");
var browserify  = require("browserify");
var source      = require("vinyl-source-stream");
var browserSync = require("browser-sync");
var reload      = browserSync.reload;
var nib         = require("nib");
var del         = require("del");

// Gulp-related
var gulp        = require("gulp");
var changed     = require("gulp-changed");
var jade        = require("gulp-jade");
var preprocess  = require("gulp-preprocess");
var shell       = require("gulp-shell");
var stylus      = require("gulp-stylus");

// local modules
var args = require("./gulp/cli").parse();
var config = require("./gulp/config");
var utils  = require("./gulp/utils");
var _year = new Date().getFullYear().toString();

var qzdataPath = '/Users/dyanofsky/Sites/qzdata-new/qzdata';
var thingName = 'qz-sexmap';
var thingPath = qzdataPath + '/' + '2014/qz-sexmap';

var isProd = args.build ? true : false;
var env = isProd ? "prod" : "dev";
var preprocessOpts = { context: { GULP_ENV: env } };
var shellCmd = utils.generateShellCmd(args.build, thingPath, thingName);

// Process conditional comments
gulp.task("preprocess", function () {
  return gulp.src(["src/**", "!src/assets{,/**}", "!src/fonts{,/**}","!src/data{,/**}"])
    .pipe(changed(config.dirs.tmp))
    .pipe(preprocess(preprocessOpts))
    .pipe(gulp.dest(config.dirs.tmp));
});

// Jade and Stylus for html, css
gulp.task("jade", ["preprocess"], function () {
  return gulp.src(config.paths.tmp.jade + "/*.jade")
    .pipe(jade({ pretty: true }))
    .pipe(gulp.dest(config.dirs.build))
    .pipe(reload({ stream: true }));
});

gulp.task("stylus", ["preprocess"], function () {
  return gulp.src(config.paths.src.styl + "/main.styl")
    .pipe(stylus({
      use: [nib()],
      "include css": true,
      errors: true
    }))
    .pipe(gulp.dest(config.paths.build.css))
    .pipe(reload({ stream: true }));
});

gulp.task("browserify", ["preprocess"], function () {
  var bundler = browserify({
    entries: [config.paths.tmp.js + "/main.js"]
  });

  if (isProd && !args["dont-minify"]) {
    bundler.transform({ global: true }, "uglifyify");
  }

  return bundler
    .bundle({debug: !isProd})
    .pipe(source("main.js"))
    .pipe(gulp.dest(config.paths.build.js))
    .pipe(reload({ stream: true }));
});

// Clean temp dir
gulp.task("clean", function (done) {
  del([
    config.dirs.tmp + "/**",
    config.dirs.build + "/**"
  ], done);
});

// Static copy-overs
gulp.task("copy-libs", function () {
  return gulp.src(config.paths.src.js + "/libs/*")
    .pipe(gulp.dest(config.paths.build.js + "/libs"))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-assets", function () {
  return gulp.src(config.paths.src.assets + "/**")
    .pipe(gulp.dest(config.paths.build.assets))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-data", function () {
  return gulp.src(config.paths.src.data + "/**")
    .pipe(gulp.dest(config.paths.build.data))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-fonts", function () {
  return gulp.src(config.paths.src.fonts + "/**")
    .pipe(gulp.dest(config.paths.build.fonts))
    .pipe(reload({ stream: true }));
});

gulp.task("browser-sync", ["watch"], function () {
  browserSync({
    server: {
      baseDir: "build"
    },
    open: false
  });
});

// Serve files, watch for changes and update
gulp.task("watch", [
  "browserify",
  "jade",
  "stylus",
  "copy-libs",
  "copy-assets",
  "copy-data",
  "copy-fonts"
], function (done) {
  gulp.watch(config.paths.src.js + "/**", ["browserify"]);
  gulp.watch(config.paths.src.styl + "/**", ["stylus"]);
  gulp.watch(config.paths.src.jade + "/**", ["jade"]);
  gulp.watch(config.paths.src.fonts + "/**", ["copy-fonts"]);
  gulp.watch(config.paths.src.data + "/**", ["copy-data"]);
  done();
});

gulp.task('shell', [
  'browserify',
  'jade',
  'stylus',
  'copy-libs',
  'copy-assets',
  "copy-data",
  'copy-fonts'
], shell.task(shellCmd));

gulp.task('build', ['shell']);

if (args.build) {
  gulp.task("default", ["clean"], function () {
    gulp.start("build");
  });
} else {
  gulp.task("default", ["clean"], function () {
    gulp.start("browser-sync");
  });
}

