var json;

function start() {

    var img = new Image();

    img.onload = function () {
        document.getElementById("webcam").getContext("2d").drawImage(this, 0, 0);
    }

    updateStats();

    img.src = "makerbot.png" + "?t=" + new Date().getTime();

    setTimeout("start()", 250);

}

function readJSON() {

    var JSONFile = new XMLHttpRequest();

    JSONFile.open("GET", "makerbot.json", true);

    JSONFile.onreadystatechange = function () {

        if (JSONFile.readyState === 4) {

            if (JSONFile.status === 200 || JSONFile.status === 0) {

                json = JSON.parse(JSONFile.responseText || "null");

            }

        }

    }

    JSONFile.send(null);

}

function updateStats() {

    readJSON();

    if (json == null) { return; }

    var regex = /\/.*\/(.*?)\./g;

    document.getElementById("printer").innerHTML = json.result.machine_name;
    document.title = json.result.machine_name;

    var currentTime = new Date(null);
    var targetTime = new Date(null);

    var progress_bar    = document.getElementById("bar");
    var progress_status = document.getElementById("print_progress");
    var print_name      = document.getElementById("print_name");
    var temperature     = document.getElementById("temp");
    var time_current    = document.getElementById("time_current");
    var time_target     = document.getElementById("time_target");
    var material_use    = document.getElementById("material_use");

    time_current.innerHTML    = "--";
    time_target.innerHTML     = "--";

    temperature.innerHTML     = json.result.toolheads.extruder[0].current_temperature + "&deg;C";

    if (json.result.current_process == null) {
        progress_status.innerHTML = "Ready to Print";
        print_name.innerHTML      = "&nbsp";
        return;
    }

    progress_bar.style.width  = json.result.current_process.progress + '%';
    progress_status.innerHTML = json.result.current_process.progress + "%";

    currentTime.setSeconds(json.result.current_process.elapsed_time);
    targetTime.setSeconds(json.result.current_process.time_estimation);

    print_name.innerHTML = regex.exec(json.result.current_process.filename)[1].substring(0, 10);

    var filament = json.result.current_process.extrusion_mass_g;
    material_use.innerHTML = filament + "g (" + (json.result.current_process.extrusion_mass_g*0.0022).toFixed(2) + "lb)";

    switch (json.result.current_process.step) {

        case 'clear_build_plate':
            progress_status.innerHTML = "Clear Build Plate " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "&deg;C)";
            break;

        case 'initial_heating':
            progress_status.innerHTML = "Initial Heating " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "&deg;C)";
            break;

        case 'homing':
            progress_status.innerHTML = "Homing " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "&deg;C)";
            break;

        case 'position_found':
            progress_status.innerHTML = "Position Found " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "°C)";
            break;

        case 'final_heating':
            progress_status.innerHTML = "Final Heating " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "°C)";
            break;

        case 'printing':
            progress_status.innerHTML = "Printing " + progress_status.innerHTML;
            temperature.innerHTML     = temperature.innerHTML + " (" + json.result.toolheads.extruder[0].target_temperature + "°C)";
            time_current.innerHTML    = currentTime.toISOString().substr(11, 8);
            time_target.innerHTML     = targetTime.toISOString().substr(11, 8);
            break;

        case 'completed':
            progress_status.innerHTML = "Completed " + progress_status.innerHTML;
            time_current.innerHTML    = currentTime.toISOString().substr(11, 8);
            time_target.innerHTML     = targetTime.toISOString().substr(11, 8);
            break;

    }

}

function kToLbs(pK) {
    return Math.floor(pK/0.45359237);
}