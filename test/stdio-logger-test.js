var buster = require("buster");
var assert = buster.assert;
var stdioLogger = require("./../lib/stdio-logger");

buster.testCase("stdio logger", {
    setUp: function () {
        var self = this;
        this.stdout = "";
        this.stderr = "";
        var join = function (arr, sep) { return [].join.call(arr, sep); };

        this.logger = stdioLogger.create(
            { write: function () { self.stdout += join(arguments, " "); } },
            { write: function () { self.stderr += join(arguments, " "); } }
        );
    },

    "should write debug messages to stdout": function () {
        this.logger.d("Hey");
        this.logger.d("There");

        assert.equals(this.stdout, "Hey\nThere\n");
    },

    "should write info messages to stdout": function () {
        this.logger.info("Hey");
        this.logger.i("There");

        assert.equals(this.stdout, "Hey\nThere\n");
    },

    "should write log messages to stdout": function () {
        this.logger.log("Hey");
        this.logger.l("There");

        assert.equals(this.stdout, "Hey\nThere\n");
    },

    "should write warning messages to stderr": function () {
        this.logger.warn("Hey");
        this.logger.w("There");

        assert.equals(this.stderr, "Hey\nThere\n");
    },

    "should write error messages to stderr": function () {
        this.logger.error("Hey");
        this.logger.e("There");

        assert.equals(this.stderr, "Hey\nThere\n");
    },

    "should prefix with log level when being verbose": function () {
        this.logger.verbose = true;

        this.logger.d("Hey");
        this.logger.i("There");
        this.logger.l("Fella");
        this.logger.w("Woops");
        this.logger.e("Game over");

        assert.equals(this.stdout, "[DEBUG] Hey\n[INFO] There\n[LOG] Fella\n");
        assert.equals(this.stderr, "[WARN] Woops\n[ERROR] Game over\n");
    },

    "default io": {
        setUp: function () {
            var self = this;
            this.pout = process.stdout;
            this.perr = process.stderr;
            process.stdout = { write: function (str) { self.stdout += str; } };
            process.stderr = { write: function (str) { self.stderr += str; } };
        },

        tearDown: function () {
            process.stdout = this.pout;
            process.stderr = this.perr;
        },

        "should default to console for stdio": function () {
            var logger = stdioLogger.create();

            logger.i("Hey");
            logger.e("Game over");

            assert.equals(this.stdout, "Hey\n");
            assert.equals(this.stderr, "Game over\n");
        }
    }
});
