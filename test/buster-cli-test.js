var buster = require("buster");
var busterCli = require("../lib/buster-cli");
var cliHelper = require("../lib/test-helper");

buster.testCase("buster-cli", {
    setUp: function () {
        this.cli = busterCli.create();
        this.stub(this.cli, "exit");
        var stdout = this.stdout = cliHelper.writableStream("stdout");
        var stderr = this.stderr = cliHelper.writableStream("stderr");
        this.logger = this.cli.createLogger(this.stdout, this.stderr);
    },

    "logger level": {
        "is set to log by default": function () {
            this.logger.info("Yo man");
            this.logger.log("Hey");

            refute.stdout("Yo man");
            assert.stdout("Hey");
        },

        "is set to info with --log-level": function (done) {
            this.cli.parseArgs(["--log-level", "info"], done(function () {
                this.logger.info("Yo man");
                this.logger.log("Hey");

                assert.stdout("Yo man");
            }.bind(this)));
        },

        "includes --log-level in help output": function (done) {
            this.cli.addHelpOption();
            this.cli.parseArgs(["-h"], done(function () {
                assert.stdout("-l/--log-level");
                assert.stdout("Set logging level");
            }));
        },

        "fails for -l without argument": function (done) {
            this.cli.parseArgs(["-l"], done(function () {
                assert.stderr("No value specified");
            }));
        },

        "fails if providing illegal logging level": function (done) {
            this.cli.parseArgs(["-l", "dubious"], done(function () {
                assert.stderr("one of [error, warn, log, info, debug], " +
                              "got dubious");
            }));
        },
        
        "is set to info with -v": function (done) {
            this.cli.parseArgs(["-v"], done(function () {
                this.logger.debug("Yo man");
                this.logger.info("Hey");
                refute.stdout("Yo man");
                assert.stdout("Hey");
            }.bind(this)));
        },

        "is set to debug with -vv": function (done) {
            this.cli.parseArgs(["-vv"], done(function () {
                this.logger.debug("Yo man");
                this.logger.info("Hey");

                assert.stdout("Yo man");
            }.bind(this)));
        },

        "fails if setting -v more than twice": function (done) {
            this.cli.parseArgs(["-vvv"], done(function () {
                assert.stderr("-v/--verbose can only be set 2 times.");
            }));
        }
    },

    "generic help output": {
        "includes mission statement": function (done) {
            var statement = "A small CLI that only lives in the test suite.";
            this.cli.addHelpOption(statement);

            this.cli.parseArgs(["--help"], done(function () {
                assert.stdout(statement);
            }));
        },

        "includes description": function (done) {
            var desc = "How about that.";
            this.cli.addHelpOption("Yo", desc);
            this.cli.parseArgs(["--help"], done(function () {
                assert.stdout(desc);
            }));
        },

        "lists help output for all options, including --help": function (done) {
            var portOpt = this.cli.opt("-p", "--port", "Help text is here.");
            this.cli.addHelpOption();
            this.cli.parseArgs(["--help"], done(function () {
                assert.stdout(/-h\/--help \s*Show this message\./);
                assert.stdout(/-p\/--port \s*Help text is here\./);
            }));
        }
    },

    "help topics": {
        setUp: function () {
            this.helpTopics = {
                "topic": "This is the text for the topic.",
                "other": "Another topic"
            };
            this.cli.addHelpOption("Yo", "Here ya go", this.helpTopics);
        },

        "are listed with the description of --help": function (done) {
            this.cli.parseArgs(["--help"], done(function () {
                assert.stdout("See also -h/--help [topic,other].");
            }));
        },

        "prints topic help with --help sometopic": function (done) {
            this.cli.parseArgs(["--help", "topic"], done(function () {
                assert.stdout("This is the text for the topic.\n");
            }));
        },

        "prints error message with --help noneexistingtopic": function (done) {
            this.cli.parseArgs(["--help", "doesnotexist"], done(function () {
                assert.stderr("No such help topic " +
                              "'doesnotexist'. Try without a specific help " +
                              "topic, or one of: topic,other.\n");
            }));
        },

        "prints topic unwrapped when just one topic": function (done) {
            var cli = busterCli.create();
            cli.createLogger(this.stdout, this.stderr);
            cli.addHelpOption(
                "", "", { "topic": "This is the text for the topic." }
            );

            cli.parseArgs(["--help"], done(function () {
                assert.stdout("See also -h/--help topic.");
            }));
        },

        "should not print topic information when no topics": function (done) {
            var cli = busterCli.create();
            cli.createLogger(this.stdout, this.stderr);
            cli.addHelpOption(
                "", "", { "topic": "This is the text for the topic." }
            );

            cli.parseArgs(["--help"], done(function () {
                refute.stdout("See also --help [].");
            }));
        }
    },

    "options": {
        setUp: function () {
            this.cli.addHelpOption();
        },

        "are addressable by short key": function (done) {
            var port = this.cli.opt("-p", "--port", "Help text is here.");
            this.cli.parseArgs(["-p"], done(function () {
                assert(port.isSet);
            }));
        },

        "is addressable by long key": function (done) {
            var port = this.cli.opt("-p", "--port", "Help text is here.");
            this.cli.parseArgs(["--port"], done(function () {
                assert(port.isSet);
            }));
        },

        "restricted to list of values": {
            setUp: function () {
                this.aaaOpt = this.cli.opt("-a", "--aaa", "Aaaaa!", {
                    values: ["foo", "bar", "baz"]
                });
            },

            "lists available options in help output": function (done) {
                this.cli.parseArgs(["--help"], done(function () {
                    assert.stdout("One of foo, bar, baz.");
                }.bind(this)));
            },

            "gets passed value": function (done) {
                this.cli.parseArgs(["-a", "bar"], done(function () {
                    assert.equals(this.aaaOpt.value, "bar");
                }.bind(this)));
            },

            "errors for value not in the list": function (done) {
                this.cli.parseArgs(["-a", "lolcat"], done(function () {
                    refute.stderr(/^$/);
                }));
            }
        },

        "with default value": {
            setUp: function () {
                this.aaaOpt = this.cli.opt("-f", "--ffff", "Fffffuuu", {
                    defaultValue: "DRM"
                });
            },

            "prints default in help text": function (done) {
                this.cli.parseArgs(["--help"], done(function () {
                    assert.stdout("Default is DRM.");
                }));
            },

            "has default value": function (done) {
                this.cli.parseArgs([], done(function () {
                    assert.equals(this.aaaOpt.value, "DRM");
                }.bind(this)));
            },

            "provides overridden value": function (done) {
                this.cli.parseArgs(["-f", "gaming consoles"], done(function () {
                    assert.equals(this.aaaOpt.value, "gaming consoles");
                }.bind(this)));
            },

            "fails with no value": function (done) {
                this.cli.parseArgs(["-f"], done(function () {
                    refute.stderr(/^$/);
                }));
            }
        },

        "with value": {
            setUp: function () {
                this.someOpt = this.cli.opt("-s", "--ss", "A creeper.", {
                    hasValue: true
                });
            },

            "gets value assigned": function (done) {
                this.cli.parseArgs(["-s", "ssssssBOOOOOM!"], done(function () {
                    assert.equals(this.someOpt.value, "ssssssBOOOOOM!");
                }.bind(this)));
            }
        },

        "with validator": {
            setUp: function () {
                this.anOpt = this.cli.opt("-c", "--character", "The character.", {
                    validators: {"required": "Here's a custom error msg."}
                });
            },

            "validates": function (done) {
                this.cli.parseArgs([], done(function () {
                    assert.stderr("Here's a custom error msg.");
                }));
            }
        }
    },

    "operand": {
        setUp: function () {
            this.fooOpd = this.cli.opd("Foo", "Does a foo.");
            this.cli.addHelpOption();
        },

        "is listed in --help output": function (done) {
            this.cli.parseArgs(["-h"], done(function () {
                assert.stdout(/Foo + {3}Does a foo/);
            }));
        },

        "gets value assigned": function (done) {
            this.cli.parseArgs(["some value"], done(function () {
                assert.equals(this.fooOpd.value, "some value");
            }.bind(this)));
        }
    },

    "panicking": {
        "logs to stderr": function () {
            this.cli.err("Uh-oh! Trouble!");

            assert.stdout(/^$/);
            assert.stderr("Uh-oh! Trouble!");
        }
    },

    "configuration": {
        setUp: function () {
            cliHelper.cdFixtures();
            this.cli.addConfigOption("buster");
        },

        tearDown: cliHelper.clearFixtures,

        "fails if config does not exist": function (done) {
            this.cli.parseArgs(["-c", "file.js"], function () {
                this.cli.loadConfig(done(function (err) {
                    assert.match(err.message, "-c/--config: file.js did not match any files");
                }));
            }.bind(this));
        },

        "fails if config is a directory": function (done) {
            cliHelper.mkdir("buster");

            this.cli.parseArgs(["-c", "buster"], function () {
                this.cli.loadConfig(done(function (err) {
                    assert.match(err.message, "-c/--config: buster did not match any files");
                }.bind(this)));
            }.bind(this));
        },

        "fails if default config does not exist": function (done) {
            this.cli.parseArgs([], function () {
                this.cli.loadConfig(done(function (err) {
                    assert(err);
                    assert.match(err.message,
                                 "-c/--config not provided, and none of\n" +
                                 "[buster.js, test/buster.js, spec/buster.js]" +
                                 " exist");
                }));
            }.bind(this));
        },

        "fails if config contains errors": function (done) {
            cliHelper.writeFile("buster.js", "modul.exports");

            this.cli.parseArgs(["-c", "buster.js"], done(function () {
                this.cli.loadConfig(function (err) {
                    assert.match(err.message,
                                 "Error loading configuration buster.js");
                    assert.match(err.message, "modul is not defined");
                    assert.match(err.stack, /\d+:\d+/);
                });
            }.bind(this)));
        },

        "fails if configuration has no groups": function (done) {
            cliHelper.writeFile("buster.js", "");

            this.cli.parseArgs([], function () {
                this.cli.loadConfig(done(function (err) {
                    assert(err);
                    assert.match(err.message,
                                 "buster.js contains no configuration");
                }));
            }.bind(this));
        },

        "configuration with --config": {
            setUp: function () {
                var json = JSON.stringify({
                    "Node tests": { environment: "node" },
                    "Browser tests": { environment: "browser" }
                });
                cliHelper.writeFile("buster.js", "module.exports = " + json);
                cliHelper.writeFile("buster2.js", "module.exports = " + json);
            },

            "loads configuration": function (done) {
                this.cli.parseArgs(["-c", "buster.js"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.defined(groups);
                    }));
                }.bind(this));
            },

            "loads multiple configuration files": function (done) {
                this.cli.parseArgs(["-c", "buster.js,buster2.js"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 4);
                    }));
                }.bind(this));
            },

            "loads multiple configuration files from glob": function (done) {
                this.cli.parseArgs(["-c", "buster*"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 4);
                    }));
                }.bind(this));
            },
    
            "fails if one of many configuration files has no groups": function (done) {
                cliHelper.writeFile("buster3.js", "");

                this.cli.parseArgs(["-c", "buster.js,buster3.js"], function () {
                    this.cli.loadConfig(done(function (err) {
                        assert(err);
                        assert.match(err.message,
                                     "buster3.js contains no configuration");
                    }));
                }.bind(this));
            }
        },

        "smart configuration loading": {
            setUp: function () {
                cliHelper.mkdir("somewhere/nested/place");
                this.assertConfigLoaded = function (done) {
                    this.cli.parseArgs([], function () {
                        this.cli.loadConfig(done(function (err) {
                            refute.defined(err);
                        }));
                    }.bind(this));
                };
            },

            tearDown: cliHelper.clearFixtures,

            "with config in root directory": {
                setUp: function () {
                    var cfg = { environment: "node" };
                    cliHelper.writeFile("buster.js", "module.exports = " +
                                        JSON.stringify({ "Node tests": cfg }));
                },

                "finds configuration in parent directory": function (done) {
                    process.chdir("somewhere");
                    this.assertConfigLoaded(done);
                },

                "finds configuration three levels down": function (done) {
                    process.chdir("somewhere/nested/place");
                    this.assertConfigLoaded(done);
                }
            },

            "with config in root/test directory": {
                setUp: function () {
                    var cfg = { environment: "node" };
                    cliHelper.mkdir("test");
                    cliHelper.writeFile("test/buster.js", "module.exports = " +
                                        JSON.stringify({ "Node tests": cfg }));
                },

                "finds configuration in parent directory": function (done) {
                    process.chdir("somewhere");
                    this.assertConfigLoaded(done);
                },

                "finds configuration three levels down": function (done) {
                    process.chdir("somewhere/nested/place");
                    this.assertConfigLoaded(done);
                }
            }
        },

        "config groups": {
            setUp: function () {
                var json = JSON.stringify({
                    "Node tests": { environment: "node" },
                    "Browser tests": { environment: "browser" }
                });
                cliHelper.writeFile("buster.js", "module.exports = " + json);
            },

            tearDown: cliHelper.clearFixtures,

            "should only yield config for provided group": function (done) {
                this.cli.parseArgs(["-g", "Browser tests"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 1);
                        assert.equals(groups[0].name, "Browser tests");
                    }));
                }.bind(this));
            },

            "only yields config for fuzzily matched group": function (done) {
                this.cli.parseArgs(["-g", "browser"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 1);
                        assert.equals(groups[0].name, "Browser tests");
                    }));
                }.bind(this));
            },

            "fails if no groups match": function (done) {
                this.cli.parseArgs(["-g", "stuff"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.match(err.message,
                                     "buster.js contains no configuration " +
                                     "groups that matches 'stuff'");
                        assert.match(err.message, "Try one of");
                        assert.match(err.message, "Browser tests");
                        assert.match(err.message, "Node tests");
                    }));
                }.bind(this));
            }
        },

        "config environments": {
            setUp: function () {
                var json = JSON.stringify({
                    "Node tests": { environment: "node" },
                    "Browser tests": { environment: "browser" }
                });
                cliHelper.writeFile("buster.js", "module.exports = " + json);
            },

            "only yields config for provided environment": function (done) {
                this.cli.parseArgs(["-e", "node"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 1);
                        assert.equals(groups[0].name, "Node tests");
                    }));
                }.bind(this));
            },

            "matches config environments with --environment": function (done) {
                this.cli.parseArgs(["--environment", "browser"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert.equals(groups.length, 1);
                        assert.equals(groups[0].name, "Browser tests");
                    }));
                }.bind(this));
            },

            "fails if no environments match": function (done) {
                this.cli.parseArgs(["-e", "places"], function () {
                    this.cli.loadConfig(done(function (err, groups) {
                        assert(err);
                        assert.match(err.message,
                                     "buster.js contains no configuration " +
                                     "groups for environment 'places'");
                        assert.match(err.message, "Try one of");
                        assert.match(err.message, "browser");
                        assert.match(err.message, "node");
                    }));
                }.bind(this));
            },

            "fails if no groups match environment and group": function (done) {
                this.cli.parseArgs(["-e", "node", "-g", "browser"], function () {
                    this.cli.loadConfig(done(function (err) {
                        assert(err);
                        assert.match(err.message,
                                     "buster.js contains no configuration " +
                                     "groups for environment 'node' that " +
                                     "matches 'browser'");
                        assert.match(err.message, "Try one of");
                        assert.match(err.message, "Node tests (node)");
                        assert.match(err.message, "Browser tests (browser)");
                    }));
                }.bind(this));
            }
        },

        "config files": {
            setUp: function () {
                var json = JSON.stringify({
                    "Node tests": {
                        environment: "node",
                        sources: ["src/1.js"],
                        tests: ["test/**/*.js"]
                    }
                });
                cliHelper.writeFile("buster.js", "module.exports = " + json);
                cliHelper.writeFile("src/1.js", "Src #1");
                cliHelper.writeFile("test/1.js", "Test #1");
                cliHelper.writeFile("test/2.js", "Test #2");
                cliHelper.writeFile("test/other/1.js", "Other test #1");
                cliHelper.writeFile("test/other/2.js", "Other test #2");
            },

            tearDown: cliHelper.clearFixtures,

            "strips unmatched files in tests": function (done) {
                this.cli.parseArgs(["--tests", "test/1.js"], function () {
                    this.cli.loadConfig(function (err, groups) {
                        groups[0].resolve().then(done(function (rs) {
                            assert.equals(rs.loadPath.paths().length, 2);
                            refute.defined(rs.get("test2.js"));
                        }));
                    });
                }.bind(this));
            },

            "matches directories in tests": function (done) {
                this.cli.parseArgs(["--tests", "test/other/**"], function () {
                    this.cli.loadConfig(function (err, groups) {
                        groups[0].resolve().then(done(function (rs) {
                            assert.equals(rs.loadPath.paths().length, 3);
                            assert.defined(rs.get("test/other/1.js"));
                            refute.defined(rs.get("test/2.js"));
                        }));
                    });
                }.bind(this));
            },

            "resolves relative paths": function (done) {
                process.chdir("..");
                this.cli.parseArgs(["-c", "fixtures/buster.js",
                              "--tests", "fixtures/test/1.js"], function () {
                    this.cli.loadConfig(function (err, groups) {
                        groups[0].resolve().then(done(function (rs) {
                            assert.equals(rs.loadPath.paths().length, 2);
                            refute.defined(rs.get("test2.js"));
                        }));
                    });
                }.bind(this));
            }
        }
    },

    "cli customization": {
        setUp: function () {
            this.busterOpt = process.env.BUSTER_OPT;
        },

        tearDown: function () {
            process.env.BUSTER_OPT = this.busterOpt;
        },

        "adds command-line options set with environment variable": function () {
            var stub = this.stub(this.cli.args, "handle");
            this.cli.environmentVariable = "BUSTER_OPT";
            process.env.BUSTER_OPT = "--color none -r specification";

            this.cli.parseArgs([]);

            assert.calledWith(stub, ["--color", "none", "-r", "specification"]);
        },

        "does not add cli options when no env variable is set": function () {
            var stub = this.stub(this.cli.args, "handle");
            process.env.BUSTER_OPT = "--color none -r specification";

            this.cli.parseArgs([]);

            assert.calledWith(stub, []);
        }
    }
});
