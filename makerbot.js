var printers = [];

function start() {

    parseJSON('makerbot.auth', function(json) {

        json.printers.forEach(function(prn) {

            var ip_regex = /(?:\d{1,3}\.\d{1,3}\.)(\d{1,3}\.\d{1,3})/g;
            var ip_octet = ip_regex.exec(prn.ip);
            printers.push(ip_octet[1]);

            document.body.innerHTML += getPrinterContainer(ip_octet[1]);

        });

        printerStats();

    });

}

function printerStats() {

    printers.forEach(function(prn) {

        var img = new Image();

        parseJSON('makerbot-' + prn + '.json', function(json) {
            updateStats(prn, json);
        });

        img.onload = function () {
            document.getElementById("webcam-" + prn).getContext("2d").drawImage(this, 0, 0);
        }

        img.src = "makerbot-" + prn + ".png" + "?t=" + new Date().getTime();

    });

    setTimeout("printerStats()", 250);

}

function parseJSON(file, callback) {

    var rawFile = new XMLHttpRequest();

    rawFile.open("GET", file);

    rawFile.onreadystatechange = function () {

        if (rawFile.readyState == 4 && rawFile.status === 200) {

            return callback(JSON.parse(rawFile.responseText));

        }

    }

    rawFile.send(null);

}

function getPrinterContainer(ip) {

    var container = "<div id='container-" + ip + "'>";

    container += "<canvas id='webcam-" + ip + "' width='320' height='240'></canvas>";
    container += "<div id='progress-" + ip + "'><div id='bar-" + ip + "'></div><div id='counter-" + ip + "'><span id='print_progress-" + ip + "'>Loading ...</span></div></div>";
    container += "<span class='name' id='print_name-" + ip + "'>&nbsp;</span>";
    container += "<div class='stat'><span class='stat_type'>Extruder:</span><span class='result' id='temp-" + ip + "'>--</span></div>";
    container += "<div class='stat'><span class='stat_type'>Elapsed Time:</span><span class='result' id='time_current-" + ip + "'>--</span></div>"
    container += "<div class='stat'><span class='stat_type'>Estimated Time:</span><span class='result' id='time_target-" + ip + "'>--</span></div>"
    container += "<div class='stat'><span class='stat_type'>Material Use:</span><span class='result' id='material_use-" + ip + "'>--</span></div>"
    container += "<div class='stat'><span class='stat_type'>Printer:</span><span class='result' id='printer-" + ip + "'>--</span></div></div>";

    return container;

}

function updateStats(ip, bot) {

    var regex = /\/.*\/(.*?)\./g;

    document.getElementById("printer-" + ip).innerHTML = bot.result.machine_name;

    var currentTime = new Date(null);
    var targetTime = new Date(null);

    var progress_bar    = document.getElementById("bar-" + ip);
    var progress_status = document.getElementById("print_progress-" + ip);
    var print_name      = document.getElementById("print_name-" + ip);
    var temperature     = document.getElementById("temp-" + ip);
    var time_current    = document.getElementById("time_current-" + ip);
    var time_target     = document.getElementById("time_target-" + ip);
    var material_use    = document.getElementById("material_use-" + ip);

    time_current.innerHTML    = "--";
    time_target.innerHTML     = "--";

    temperature.innerHTML     = bot.result.toolheads.extruder[0].current_temperature + "&deg;C";

    if (bot.result.current_process == null) {
        progress_status.innerHTML = "Ready to Print";
        print_name.innerHTML      = "&nbsp";
        return;
    }

    progress_bar.style.width  = bot.result.current_process.progress + '%';
    progress_status.innerHTML = bot.result.current_process.progress + "%";

    currentTime.setSeconds(bot.result.current_process.elapsed_time);
    targetTime.setSeconds(bot.result.current_process.time_estimation);

    print_name.innerHTML = regex.exec(bot.result.current_process.filename)[1].substring(0, 10);

    var filament = bot.result.current_process.extrusion_mass_g;
    material_use.innerHTML = filament + "g (" + (bot.result.current_process.extrusion_mass_g*0.0022).toFixed(2) + "lb)";

    switch (bot.result.current_process.step) {

        case 'clear_build_plate':
            progress_status.innerHTML = "Clear Build Plate " + progress_status.innerHTML;
            material_use.innerHTML    = "--";
            break;

        case 'transfer':
            progress_status.innerHTML = "Transfer " + progress_status.innerHTML;
            material_use.innerHTML    = "--";
            break;

        case 'initial_heating':
            progress_status.innerHTML = "Initial Heating " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + bot.result.toolheads.extruder[0].target_temperature + "&deg;C)";
            material_use.innerHTML    = "--";
            break;

        case 'homing':
            progress_status.innerHTML = "Homing " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + bot.result.toolheads.extruder[0].target_temperature + "&deg;C)";
            material_use.innerHTML    = "--";
            break;

        case 'position_found':
            progress_status.innerHTML = "Position Found " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + bot.result.toolheads.extruder[0].target_temperature + "°C)";
            material_use.innerHTML    = "--";
            break;

        case 'final_heating':
            progress_status.innerHTML = "Final Heating " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + bot.result.toolheads.extruder[0].target_temperature + "°C)";
            material_use.innerHTML    = "--";
            break;

        case 'printing':
            progress_status.innerHTML = "Printing " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + bot.result.toolheads.extruder[0].target_temperature + "°C)";
            time_current.innerHTML    = currentTime.toISOString().substr(11, 8);
            time_target.innerHTML     = targetTime.toISOString().substr(11, 8);
            break;
			
		case 'preheating_resuming':
			progress_status.innerHTML = "Resuming " + progress_status.innerHTML;
			break;

		case 'suspended':
			progress_status.innerHTML = "Suspended " + progress_status.innerHTML;
			break;

        case 'completed':
            progress_status.innerHTML = "Completed " + progress_status.innerHTML;
            time_current.innerHTML    = currentTime.toISOString().substr(11, 8);
            time_target.innerHTML     = targetTime.toISOString().substr(11, 8);
            break;

    }

}