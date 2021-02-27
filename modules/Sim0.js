(function (window) {

    "use strict";

    //alert("Now in Sim");

    class Sim {
        constructor(opts) {
            console.log("Sim", opts);
            //alert("created Sim "+JSON.stringify(opts));
        }

        log(str) {
            console.log("logging", str);
        }

        run() {
            $("#logDiv").html("running");
        }
    }

    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = Sim;
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return Sim;
        });
    }
    else {
        window.Sim = Sim;
    }

})(this);

//export {Sim};
