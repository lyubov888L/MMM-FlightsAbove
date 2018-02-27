/* --------------------------------------------------------------------------
 * Module:       MMM-FlightsAbove
 * FileName:     MMM-FlightsAbove.js
 * Author:       E:V:A
 * License:      MIT
 * Date:         2018-02-27
 * Version:      0.0.1
 * Description:  A MagicMirror module to display planes in the sky above you
 * Format:       4-space TAB's (no TAB chars), mixed quotes
 *
 * URL1:         https://github.com/E3V3A/MMM-FlightsAbove
 * --------------------------------------------------------------------------
 * About Tabulator CSS & Themes:
 *   http://tabulator.info/docs/3.4?#css
 *   http://tabulator.info/examples/3.4?#theming
 * --------------------------------------------------------------------------
 * Tabulator Requires:
 * "node_modules/jquery/dist/jquery.min.js",
 * "node_modules/jquery-ui-dist/jquery-ui.min.js",
 * "node_modules/jquery-ui-dist/jquery-ui.css",
 * "node_modules/jquery.tabulator/dist/js/tabulator.js",
 * "node_modules/jquery.tabulator/dist/css/tabulator.css",
 * --------------------------------------------------------------------------
 */

// WIP !
/*
   ==========================================================================
    Flight  CallSig  From  To   Speed Bearing  Alt[m]
    -------------------------------------------------
    SN2588  BEL88T   TXL   BRU  246   262      14815

    # We want the following config attributes:
    // The following items are used to calculate the radar area
    // bounding box from which airplanes will be reported.
    location: "54,21"   // Lat/Lon of radar location
    losradius: 100,     // Line of Sight radius in [km] of planes to be shown
    speedunit: "kmh"    // kmh | kn (default)
    altunit:   "m"      //   m | ft (default)
    fontsize:  "small"  // [small,medium,large]
    updates: 200,       // Update frequency in seconds
    itemlist: [flight,callsig,to,from,alt,bearing,speed] // also: [id,registration,model,modes, radar]
   ==========================================================================
*/

'use strict'

Module.register('MMM-FlightsAbove',{

    defaults: {
        header: "Flights Above",        // The module header text, if any. (Use: "" to remove.)
//        headingIndicator: "decimal",    // ["decimal", "compass"] Type of heading indicator (I.e. "45" vs "NE")
        updateInterval: 10000,          // [ms] 3*60*1000 // Radar scan/ping/update period [default 3 min]
//        maxItems: 10,                   // MAX Number of planes to display [default is 10]
        // The geographical (map) Boundary-Box (BB), from within planes will be shown are given by:
        // the maximim Lat/Lon edges of: [N-lat, W-lon, S-lat, E-lon] - all in decimal degrees.
//        radarBBox: "-8.20917,114.62177,-9.28715,115.71243", // "DPS" (Bali Airport)
//        radarLocation: "23.2,54.2",     // [Lat,Lon] - The location of radar center in decimal degrees
//        radarRadius: 60,                // [km] - The maximum distance of planes shown.
//        watchList: "",                   // Highlight planes/flights/types on watch list
    },

    requiresVersion: "2.1.0",

    start: function() {
        this.loaded = false;
        // This should be CONFIG!
        //this.sendSocketNotification("CONFIG", this.config);
        this.sendSocketNotification("REQUEST_DATA", this.config);
    },

    getDom: function() {
        let w = document.createElement("div");  // Let w be the "wrapper"
        w.id = "flightsabove";                  // The id used by Tabulator

        if (!this.loaded) {
            w.innerHTML = "Loading...";
            w.className = "dimmed light small";
            return w;
        }
        if (!this.data) {
            w.innerHTML = "No data!";
            w.className = "dimmed light small";
            return w;
        }
        w.innerHTML = "Waiting for Tabulator...";
        return w;
    },

    getScripts: function() {
        return [
            this.file('node_modules/jquery/dist/jquery.min.js'),
            this.file('node_modules/jquery-ui-dist/jquery-ui.min.js'),
            this.file('node_modules/jquery.tabulator/dist/js/tabulator.js')
        ];
    },

    getStyles: function() {
        return [
            this.file('node_modules/jquery-ui-dist/jquery-ui.css'),
            //this.file('node_modules/jquery.tabulator/dist/css/tabulator.css'),                // Standard Theme
            this.file('node_modules/jquery.tabulator/dist/css/tabulator_midnight.min.css'),     // Midnight Theme
            //this.file('node_modules/jquery.tabulator/tabulator_simple.min.css'),              // Simple Theme
            //this.file('node_modules/jquery.tabulator/bootstrap/tabulator_bootstrap.min.css'), // Bootstrap Theme
            "MMM-FlightsAbove.css"                                                              // FlightsAbove Theme
        ];
    },

    getTranslations: function() { return false; }, // Nothing to translate

    // This come from the MM CORE or from other modules
    notificationReceived: function (notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            // The div with id "flightsabove" now exists, so we can load Tabulate.
            this.loadTabulate();
        }
    },

    // This comes from YOUR module, usually "node_helper.js"
    socketNotificationReceived: function(notification, payload) {
        console.log("=====> " + this.name + " received a socket notification: " + notification); //+ " - Payload: " + payload);
        switch (notification) {
            case "NEW_DATA":
                console.log("-----> FlightsAbove: NEW_DATA received!"); // Why doesn't this show?
                let ping = payload;
                console.log("-- PING!\n");
                console.log(ping);
                //console.log("-- PING DATA:\n", ping);

                this.loaded = true;
                this.setTableData(payload);
                break;
            default:
                console.log("Did not match the Notification: ", notification);
        }
    },

    //===================================================================================
    //  From here:  Tabulator specific code
    //===================================================================================
    loadTabulate: function() {

        // see: http://tabulator.info/docs/3.3#mutators
        /*Tabulator.extendExtension("mutator", "mutators", {
            ft2met:function(value, data, type, mutatorParams){
                return (value * 0.3048).toFixed(0);
            },
        });*/

        Tabulator.extendExtension("format", "formatters", {
            ft2mt:function(cell, formatterParams) {              // Feet to Meters
                return  (0.3048*cell.getValue()).toFixed(0);
            },
            kn2km:function(cell, formatterParams) {              // Knots to Kilometers
                return  (1.852*cell.getValue()).toFixed(0);
            },
            ep2time:function(cell, formatterParams) {            // POSIX epoch to hh:mm:ss
                let date = new Date(cell.getValue());
                // We use "en-GB" only to get the correct formatting for a 24 hr clock, not your TZ.
                return date.toLocaleString('en-GB', { hour:'numeric', minute:'numeric', second:'numeric', hour12:false } );
            },
            deg2dir:function(cell, formatterParams) {           // Heading [deg] to approximate Compass Direction
                let val = Math.floor((cell.getValue() / 22.5) + 0.5);
                let arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
                return arr[(val % 16)];
            },
/*
            sqCheck:function(cell, formatterParams){            // Check squawk codes and warn/highlight for unusual flights
                let sqwk = new cell.getValue();

                let MilPlanesUS = [{}];
                let MilPlanesRU = [{}];

                let SqCodesMIL = [{}]; // Squawk codes for Military/Government operations
                let SqCodesEMG = [{}]; // Squawk codes for Emergencies
                let SqCodesUFO = [{}]; // Squawk codes that are unusual

                // pseudo code:
                if (sqwk in SqCodesMIL) { highlight with bright green }
                if (sqwk in SqCodesEMG) { highlight with bright red & send notfication }
                if (sqwk in SqCodesUFO) { highlight with bright cyan||magenta }

                return xxxx;
        },
*/
        });

        let flightTable = $("#flightsabove");

        flightTable.tabulator({
            height:205,                         // Set height of table, this enables the Virtual DOM and improves render speed
            //layout:"fitColumns",                // Fit columns to width of table (optional)
            //headerSort:false,                   // Disable header sorter
            resizableColumns:false,             // Disable column resize
            responsiveLayout:true,              // Enable responsive layouts
            placeholder:"Waiting for data...",  // Display message to user on empty table
            initialSort:[                       // Define the sort order:
                {column:"altitude",     dir:"asc"},     // 1'st
                //{column:"flight",     dir:"desc"},    // 2'nd
                //{column:"bearing",    dir:"asc"},     // 3'rd
            ],
            columns:[
                {title:"Flight",        field:"flight",         headerSort:false, sortable:false, responsive:0, align:"left"}, // , width:250},
                {title:"CallSig",       field:"callsign",       headerSort:false, sortable:false, visible:true, responsive:3},
                {title:"To",            field:"destination",    headerSort:false, sortable:false, responsive:0},
                {title:"From",          field:"origin",         headerSort:false, sortable:false, responsive:0},
                {title:"Speed",         field:"speed",          headerSort:false, sortable:false, responsive:2, formatter:"kn2km"}, // [km/h]
                {title:"Bearing",       field:"bearing",        headerSort:false, sortable:false, responsive:1},
                {title:"Alt [m]",       field:"altitude",       headerSort:false, sortable:false, responsive:0, formatter:"ft2mt", align:"right", sorter:"number"},
                //{title:"Alt [m]",       field:"altitude",       sortable:true,  responsive:0, align:"right", sorter:"number", mutateType:"data", mutator:ft2met"},
                // Additional items:
                {title:"F24id",         field:"id",             headerSort:false, sortable:false, visible:false},
                {title:"RegID",         field:"registration",   headerSort:false, sortable:false, visible:false},
                {title:"Model",         field:"model",          headerSort:false, sortable:false, visible:true,  responsive:1},
//                {title:"ModeS",         field:"modes",          headerSort:false, sortable:false, visible:false},
                {title:"ModeS",         field:"modeSCode",          headerSort:false, sortable:false, visible:false},
                {title:"Radar",         field:"radar",          headerSort:false, sortable:false, visible:false},
                {title:"Lat",           field:"latitude",       headerSort:false, sortable:false, visible:false},
                {title:"Lon",           field:"longitude",      headerSort:false, sortable:false, visible:false},

                {title:"Time",          field:"timestamp",      headerSort:false, sortable:false, visible:false, responsive:1, formatter:"ep2time"},
                {title:"RoC [ft/m]",    field:"climb",          headerSort:false, sortable:false, visible:false},
                {title:"Squawk",        field:"squawk",         headerSort:false, sortable:false, visible:true, responsive:1}, // formatter:"sqCheck"},
                {title:"isGND",         field:"ground",         headerSort:false, sortable:false, visible:false},
                {title:"isGlider",      field:"glider",         headerSort:false, sortable:false, visible:false},
            ],
        });

        $(window).resize(function () {
            flightTable.tabulator("redraw");
        });
    },

    setTableData: function(data) {
        $("#flightsabove").tabulator("setData", data);
    }

    // To immediately sort (programatically):
    // $("#flightsabove").tabulator("setSort", "altitude", "asc");

    //trigger AJAX load on "Load Data via AJAX" button click
    /*$("#ajax-trigger").click(function(){
        $("#flightsabove").tabulator("setData", "/sample_data/ajax/data.php");
    });*/

    //===================================================================================

});
