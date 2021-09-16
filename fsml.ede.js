
/* FSML EDE 0.2 */

/* FSML programming language elementary IDE */
/* (c) 2021 Alexandr Stadnichenko */
/* License : BSD */
/* Ver : 0.2.3 */
/* Upd : 21.04.04 */


cl = console .log; // Aforethought if global!


;(function(){


function Rectarea (left, right, top, bottom, width, height, updatable_style_props) {

    this .left = left ;
    this .right = right ;
    this .top = top ;
    this .bottom = bottom ;
    this .width = width;
    this .height = height;
    this .updatable_style_props = updatable_style_props; }

Rectarea .prototype .upd_self = function (){
    this .height = window .innerHeight; }

Rectarea .prototype .upd_style_props = function (container){
    var usp = this .updatable_style_props;
    var self = this;
    usp .map (function (prop){ container .style [prop] = self [prop] +"px"; }); }


var tw_area = new Rectarea (0, 0, 0, 0, null, window .innerHeight,
                            ["left", "right", "top", "bottom"]);

// (window .innerWidth -16) /2
var cp_area = new Rectarea (window .innerWidth -16 -200, null, 0, 0, null, null,
                            ["left", "top", "bottom"]);

var lp_area = new Rectarea (4, null, 4, 4, cp_area .left -16, null,
                            ["left", "top", "bottom", "width"]);

// (window .innerWidth -16) /2 +16
var rp_area = new Rectarea (window .innerWidth -200, 4, 4, 4, null, null,
                            ["left", "right", "top", "bottom"]);

var body = document .getElementsByTagName ("body")[0] ;
var tw = document .getElementById ("topwrapper");
var cp = document .getElementById ("centerpane");
var lp = document .getElementById ("leftpane");
var rp = document .getElementById ("rightpane");
var inputform = document .getElementById ("inputform");
var inbox = document .getElementById ("inbox");
var fsmlog = document .getElementById ("fsmlog");


min_zip = function (second){
    var result = [],
        first = this,
        l = first .length < second .length ? first .length : second .length;

    for (var i=0; i<l; i++)
        { result .push ([first [i], second [i]]); }

    return result; }


var areas = [tw_area, cp_area, lp_area, rp_area];
var conts = [tw, cp, lp, rp];


function upd_styles (){
min_zip .call (areas, conts) .map (function (pair){ pair [0] .upd_style_props (pair [1]); }); }

/* function upd_styles (){
    [[tw_area, tw], [cp_area, cp], [lp_area, lp], [rp_area, rp]]
        .map (function (pair){ pair [0] .upd_style_props (pair [1]); }); } */

function recalculate_all (){
//    tw_area .height = window .innerHeight;
    cp_area .left   = window .innerWidth -16 -200; //(window .innerWidth -16) /2;
    lp_area .width  = cp_area .left -16;
//    rp_area .left   = (window .innerWidth -16) /2 +16;
    rp_area .left   = window .innerWidth -200;
    upd_styles (); }



upd_styles ();

var startpoint = {"x": 0, "y": 0};
var start_cp_left;

var upd_ratio = function (dx) {
    cp_area .left = start_cp_left + dx;
    cp .style .left  = cp_area .left +"px";
    lp .style .width = ((cp_area .left -16) > 0 ? cp_area .left -16 : 0) +"px";
    rp .style .left  = cp_area .left +16 +"px";
}

var mmove = function (e) {
    e .preventDefault ();

    dx = e .clientX - startpoint .x;
    dy = e .clientY - startpoint .y;

    upd_ratio (dx); }

var mdown = function (e) {
    e .preventDefault ();

    startpoint .x = e .clientX;
    startpoint .y = e .clientY;

    start_cp_left = cp_area .left;

    body .style .cursor = "move";

    cp .removeEventListener("mousedown", mdown);
    body .addEventListener ("mouseup", mup, false);
    body .addEventListener ("mousemove", mmove, false);}


var mup = function (e) {
    e .preventDefault ();

    body .style .cursor = "default";

    body .removeEventListener("mouseup", mup);
    body .removeEventListener("mousemove", mmove);
    cp .addEventListener ("mousedown", mdown, false); }


//function nbsp_if_space (c) // dc
//    { return c === " " ? "&nbsp;" : c; }


function fsmlog_type (fsml_out){
//    fsml_in = fsml_out .split ("") .map (nbsp_if_space) .join (""); // dc
    fsml_out = fsml_out .replace (/ /g, "&nbsp;");
    fsmlog .innerHTML += "\n<br>" +fsml_out; }

fsml .environment .fsmlog_type = fsmlog_type;


function handle_submit (e){
    var fsml_eval = fsml .environment .fsml_eval,
        fsml_in = inbox .value;

    e .preventDefault ();

    fsmlog_type (fsml_in);
    inbox .value = "";
    lp .scrollBy (0, 1000);

    var fsml_eval_result = fsml_eval (fsml_in);
    fsml .environment .fsml_type_stack (); }


cp .addEventListener ("mousedown", mdown, false);
window .addEventListener ("resize", recalculate_all, false);
window .addEventListener ("contextmenu", function (e){ e .preventDefault(); }, false);
inputform .addEventListener ("submit", handle_submit, false);

})();


