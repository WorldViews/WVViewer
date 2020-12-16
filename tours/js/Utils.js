
WV = {};

//function report(str) {
//	console.log(str);
//}

WV.errsShown = {};
function error(str) {
	console.log(str);
	if (!WV.errsShown[str]) {
		WV.errsShown[str] = 1;
		alert(str);
	}
	//alert(str);
}

function fmt0(f) {
	return "" + Math.floor(f + 0.5);
}

function fmt1(f) {
	return "" + Math.floor(f * 10) / 10;
}

function fmt2(f) {
	return "" + Math.floor(f * 100) / 100;
}

function fmt3(f) {
	return "" + Math.floor(f * 1000) / 1000;
}

function toRadians(d) {
	return Math.PI * d / 180;
}

function toDegrees(r) {
	return 180 * r / Math.PI;
}

/*
  Use this instead of $.getJSON() because this will give
  an error message in the console if there is a parse error
  in the JSON.
 */
WV.getJSON = function (url, handler, errFun) {
	console.log(">>>>> getJSON: " + url);
	$.ajax({
		url: url,
		dataType: 'text',
		success: function (str) {
			try {
				data = JSON.parse(str);
				//data = eval(str);
				handler(data);
			}
			catch (e) {
				console.log("**************************************************");
				console.log("**************************************************");
				console.log("*** error: " + e);
				alert("JSON error: " + e);
				//console.log("str: "+str);
			}
		},
		error: function (e) {
			console.log("WV.getJSON error " + e);
			if (errFun)
				errFun(e);
		}
	});
}

// This is a promise based version of code for getting
// JSON.  New code should use this instead of getJSON
// and older code should migrate to this.
WV.loadJSON = async function(url) {
    console.log("loadJSON: " + url);
    return new Promise((res, rej) => {
        $.ajax({
            url: url,
            dataType: 'text',
            success: function (str) {
                var data;
                try {
                    data = JSON.parse(str);
                }
                catch (err) {
                    console.log("err: " + err);
                    alert("Error in json for: " + url + "\n" + err);
                    rej(err);
                }
                res(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Failed to get JSON for " + url);
                rej(errorThrown);
            }
        });
    })
}

