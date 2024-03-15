/*

Copyright (C) 2016-2017 Juan Luis Gonzalo Gómez, Space Dynamics Group,
ETSI Aeronáutica y del Espacio, Technical University of Madrid (UPM).


This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/


/****************************************************************************

 File:                     LambertSDG_UI_Plots.js
 Programmed By:            Juan Luis Gonzalo Gómez
 Last Modification:        08/07/2017 (Added comments, no changes in code)
 Description:              Contains objects and procedures for initializing
       the UI, retrieving/validating user input, and computing/representing
       the results.

       
Global variables:
     OrbElemList:       Array with the list of celestial bodies to be displayed
                        in the dropdown list of the UI. Each body is given as
                        an array of the form: [ "name", MJD [days], a [AU],
                        e [-], inc [deg], omega [deg], RAAN [deg], MA0 [deg] ]
     LambertInputLims:  Object defining the validity range for each numerical
                        input field. It must contain properties 'MJD', 'a', 'e',
                        'i', 'omp', 'RAAN', 'MA0', 'DepYear' and 'ToF', and each
                        of them must be an array of length 2 with the lower and
                        upper bounds (in that order)
     
Functions:
    arraymin:           Returns the minimum value of an array
    populateOEList:     Populates the dropdown list of Celestial Bodies
    updateOE:           Updates the orbital elements in the form
    getOE:              Retrieves and validates the values from the OE form.
                        Returns an 'OrbitalElements' object if all inputs are
                        valid, or error code -1 otherwise
    validateIntegerInput:  Integer field watchdog. Returns an array with the
                        status code and the (corrected) input value.
    validateRealInput:  Real field watchdog. Returns an array with the
                        status code and the (corrected) input value.
    getRadioValue:      Gets selected value from a Radio input group in a
                        given form.
    timeSelectorWatchdog:  Updates and validates the time selector fields,
                        according to selected month and possible leap years.
                        Return code is 0 if the input date is valid, -1 if
                        the year is invalid, 1 if the day had to be adjusted.
    timeSelectorGet:    Retrieves the values from a time selector as a
                        dateObj object.
    PCPInitialize:      Initializes a pork-chop plot, given a ContourPlot 
                        object and the results from a simulation.
    PCPLevelUpdater:    Function to change the plot level of a pork-chop
                        plot when the level bar is clicked. Must be added 
                        as an onclick event to the canvas.
    PCPPositionTracker: Function to add a data cursor to a pork-chop plot.
                        Must be added as an onmousemove event to the canvas.
    PCP_Calculate_Plot: Callback function for the 'calculate' buttons.
                        Retrieves/validates the input data and calculates/plots
                        the pork-chop plots. If the data retrieval fails, it
                        removes the current plots and returns an error code <0.

Onload function():
   Adds polyfills for some mathematical methods (Math.trunc, Math.atanh,
   Number.isInteger); defines global variables OrbElemList (list of celestial
   bodies) and LambertInputLimits (validity ranges for the numerical input
   fields); initializes plotting objects; and initializes input forms
   (populates the dropdown list of celestial bodies, adds the events to validate
   inputs, and adds the callback functions for the calculate buttons)


****************************************************************************/


/* arraymin(arr): Returns the minimum value of an array
   Inputs:
      arr:  Numeric array
   Output:
      Minimum value in arr
*/
 function arraymin(arr){
    var minv = arr[0]
      , k;
    for(k=1; k<arr.length; k++){
        if (arr[k]<minv) minv = arr[k];
    }
    return minv;
}


/* populateOEList(dropdownID,OEList): Populates the dropdown list of Celestial Bodies
   Inputs:
      dropdownID:  ID for the dropdown list to be populated
      OEList:      Array of bodies to be included. Each body is given as an array of
                   the form: [ "name", MJD [days], a [AU], e [-], inc [deg],
                   omega [deg], RAAN [deg], MA0 [deg] ]
*/
function populateOEList(dropdownID,OEList){
    var list  = document.getElementById(dropdownID)
      , entry = document.createElement("option")
      , i;
    
    // Create "custom" entry
    entry.text = "Custom";
    entry.value = -1;
    list.add(entry);
    // Create the entries corresponding to the bodies in OEList
    for (i=0; i<OEList.length; i++) {
        entry = document.createElement("option");
        entry.text = OEList[i][0];
        entry.value = i;
        list.add(entry);
    }
}


/* updateOE(formID,dropdownID,OEList): Updates the orbital elements in the form
   Inputs:
      formID:      ID for the form to be updated
      dropdownID:  ID for the dropdown list corresponding to the form
      OEList:      Array of bodies included in the dropdown list. Each body is
                   given as an array of the form: [ "name", MJD [days], a [AU],
                   e [-], inc [deg], omega [deg], RAAN [deg], MA0 [deg] ]
*/
function updateOE(formID,dropdownID,OEList){
    var OEfields   = [ "MJD", "a", "e", "inc", "omp", "RAAN", "MA0" ]
      , OEform     = document.getElementById(formID)
      , OEselector = document.getElementById(dropdownID)
      , OEselected = OEselector.options[OEselector.selectedIndex].value
      , i;
    
    if (OEselected<0){
        // Custom case. Unlock all fields
        for (i=0; i<OEfields.length; i++){
            OEform.elements[OEfields[i]].disabled = false;
        }
    }else{
        // Lock fields and assign values
        for (i=0; i<OEfields.length; i++){
            OEform.elements[OEfields[i]].disabled = true;
            OEform.elements[OEfields[i]].value    = OEList[OEselected][i+1];
        }
    }
}


/* getOE(formID,limits): Retrieves and validates the values from the OE form.
       Returns an 'OrbitalElements' object if all inputs are valid, or error
       code -1 otherwise
   Inputs:
      formID:      ID for the form
      limits:      Object with the limits for each input field. It must
                   contain properties 'MJD', 'a', 'e', 'i', 'omp', 'RAAN'
                   and 'MA0', and each of them must be an array of length 2
                   with the lower and upper bounds (in that order)
   Output:
      Returns an OrbitalElements object if all inputs are valid, or error code -1 otherwise
*/
function getOE(formID,limits){
    
    var oe_form = document.getElementById(formID)
      , stat = 0
      , auxvar = [0, 0]
      , oe_tags = ["MJD","a","e","inc","omp","RAAN","MA0"]
      , oe_vals = new Array(7);
    
    // Integer inputs are validated and retrieved
    auxvar = validateIntegerInput(oe_form.elements[oe_tags[0]],limits[oe_tags[0]]);
    oe_vals[0] = auxvar[1];
    stat       = auxvar[0];
    
    // Real inputs are validated and retrieved
    for (var i=1;i<7;i++){
        auxvar = validateRealInput(oe_form.elements[oe_tags[i]],limits[oe_tags[i]]);
        oe_vals[i] = auxvar[1];
        stat       = stat+auxvar[0];
    }
    
    // An 'OrbitalElements' object is returned if all inputs were valid; an error code -1 is issued otherwise
    if (stat==0){
        return new OrbitalElements(oe_vals[0], oe_vals[1], oe_vals[2], oe_vals[3], oe_vals[4], oe_vals[5], oe_vals[6] );
    }else{
        return -1
    }
}


/* validateIntegerInput(inputObj,limits): Integer field watchdog. Returns an array
       with the status code and the (corrected) input value.
   Inputs:
      inputObj:    Input field to be checked (the HTML element, not the value). It
                   is expected to have the properties 'value' and 'defaultValue',
                   and optionally 'oldValue'
      limits:      (optional) Array of length 2 with the lower and upper bounds (in
                   that order). If omitted, no limits are applied
   Outputs:
      Array of length 2 of the form [ status code, value ]. Status code can take
      the values:
         0: Input is valid (integer and within the given limits)
         1: Input exceeds the upper limit. Field is set to the upper limit
         2: Input exceeds the lower limit. Field is set to the lower limit
         3: Input is not a number. Field is returned to previous state if available
         4: Input is not integer. It is truncated, and restricted to the valid range
      If status code>0, the return value corresponds to the corrected input.
*/
function validateIntegerInput(inputObj,limits){
    
    // Input value, which may be a string, is parsed as a number using parseFloat().
    // Note that the parsing ignores any trailing text characters, so the input field
    // must be updated even if the parsed value is valid.
    var limits = limits || [ -Infinity, Infinity ]
      , curr_val = parseFloat(inputObj.value)
      , status
      , new_val; // Input value after validation
      
    if ( isNaN(curr_val) ) {
        // Input is not a number. Field is returned to a previous state if available
        new_val = inputObj.oldValue || inputObj.defaultValue;
        inputObj.value = new_val;
        status = 3;
    } else if (!Number.isInteger(curr_val)) {
        // Input is not integer. It is truncated, and restricted to the validity range if needed
        new_val = Math.min( Math.max(limits[0], Math.trunc(curr_val)), limits[1] );
        inputObj.value = new_val;
        status = 4;
    } else if (curr_val<limits[0]) {
        // Value exceeds the lower limit
        new_val = limits[0];
        inputObj.value = new_val;
        status = 2;
    } else if (curr_val>limits[1]) {
        // Value exceeds the upper limit
        new_val = limits[1];
        inputObj.value = new_val;
        status = 1;
    } else {
        // No issues detected. The 'value' and 'oldValue' properties are updated (the
        // former is updated to remove any trailing characters which may have been
        // ignored by parseFloat() )
        new_val = curr_val;
        inputObj.value    = new_val;
        inputObj.oldValue = new_val;
        status = 0;
    }
    
    if (status!==0) { // Display error message if needed
        alert('Input '+inputObj.name+' must be an integer number between '+limits[0]+' and '+limits[1]+'.');
    }
    
    return [ status, new_val ];
}


/* validateRealInput(inputObj,limits): Real field watchdog. Returns an array
       with the status code and the (corrected) input value.
   Inputs:
      inputObj:    Input field to be checked (the HTML element, not the value). It
                   is expected to have the properties 'value' and 'defaultValue',
                   and optionally 'oldValue'
      limits:      (optional) Array of length 2 with the lower and upper bounds (in
                   that order). If omitted, no limits are applied
   Outputs:
      Array of length 2 of the form [ status code, value ]. Status code can take
      the values:
         0: Input is valid (integer and within the given limits)
         1: Input exceeds the upper limit. Field is set to the upper limit
         2: Input exceeds the lower limit. Field is set to the lower limit
         3: Input is not a number. Field is returned to previous state if available
      If status code>0, the return value corresponds to the corrected input.
*/
function validateRealInput(inputObj,limits){
    
    // Input value, which may be a string, is parsed as a number using parseFloat().
    // Note that the parsing ignores any trailing text characters, so the input field
    // must be updated even if the parsed value is valid.
    var limits = limits || [ -Infinity, Infinity ]
      , curr_val = parseFloat(inputObj.value)
      , status
      , new_val;
      
    if ( isNaN(curr_val) ) {
        // Input is not a number. Field is returned to a previous state if available
        new_val = inputObj.oldValue || inputObj.defaultValue;
        inputObj.value = new_val;
        status = 3;
    } else if (curr_val<limits[0]) {
        // Value exceeds the lower limit
        new_val = limits[0];
        inputObj.value = new_val;
        status = 2;
    } else if (curr_val>limits[1]) {
        // Value exceeds the upper limit
        new_val = limits[1];
        inputObj.value = new_val;
        status = 1;
    } else {
        // No issues detected. The 'value' and 'oldValue' fields are updated (the
        // former is updated to remove any trailing characters which may have been
        // ignored by parseFloat() )
        new_val = curr_val;
        inputObj.value    = new_val;
        inputObj.oldValue = new_val;
        status = 0;
    }
    
    if (status!==0) { // Display error message if needed
        alert('Input '+inputObj.name+' must be a real number between '+limits[0]+' and '+limits[1]+'.');
    }
    
    return [ status, new_val ];
}


/* getRadioValue(formID,radioName): Gets selected value from a Radio input group
       in a given form.
   Inputs:
      formID:      ID for the form
      radioName:   Name for the radio input group
   Outputs:
      Selected value in the radio input group
*/
function getRadioValue(formID,radioName){
    var radioList = document.getElementById(formID).elements[radioName];
    for (var i=0; i<radioList.length; i++){
        if (radioList[i].checked) {
            var radioVal = radioList[i].value;
            break;
        }
    }
    return radioVal;
}


/* timeSelectorWatchdog(yearID,monthID,dayID,yearLimits): Updates and validates the
       time selector fields, according to selected month and possible leap years.
       Return code is 0 if the input date is valid, -1 if the year is invalid,
       1 if the day had to be adjusted.
   Inputs:
      yearID:      ID for the year field
      monthID:     ID for the month field
      dayID:       ID for the day field
      yearLimits:  (optional) Array of length 2 with the lower and upper bounds for
                   the year (in that order). If omitted, no limits are applied
   Outputs:
      An integer status code is returned as follows:
          0: the input date was valid
         -1: the input year was invalid
         -2: the day had to be adjusted.
*/
function timeSelectorWatchdog(yearID,monthID,dayID,yearLimits){
    var yearField  = document.getElementById(yearID)
      , monthField = document.getElementById(monthID)
      , dayField   = document.getElementById(dayID);
      
    // Check if year is an integer within the given validity range.
    // The yearLimits input array is optional.
    var yearLimits = yearLimits || [ -Infinity, Infinity ]
      , day_change = 0;
    var auxvar = validateIntegerInput(yearField,yearLimits);
    var stat = auxvar[0]
      , year = auxvar[1];
    
    // Day field is updated according to the month
    // A flag is raised if the selected day is changed
    switch (monthField.selectedIndex){
        case 0: // January
        case 2: // March
        case 4: // May
        case 6: // July
        case 7: // August
        case 9: // October
        case 11: // December
            // 31-days months. Some days may be disabled from previous selections, make sure to re-enable them
            dayField.options[28].disabled = false;
            dayField.options[29].disabled = false;
            dayField.options[30].disabled = false;
            break;
        case 3: // April
        case 5: // July
        case 8: // September
        case 10: // November
            // 30-days months. Enable and disable days accordingly
            dayField.options[28].disabled = false;
            dayField.options[29].disabled = false;
            dayField.options[30].disabled = true;
            // If selected day is out of range, change to last day of the month
            if ( dayField.selectedIndex==30 ){
                dayField.selectedIndex = 29;
                day_change = 1;
            }
            break;
        case 1:
            // February. Year must be checked for a possible leap year
            var leap = false;
            // First check if year exactly divisible by four, then check for exceptions
            if ( (year-4*Math.round(year/4))==0 ) {
                if ( (year-100*Math.round(year/100))==0 ) {
                    // Divisible by 4 and 100. It will be leap year only if also divisible by 400
                    if ( (year-400*Math.round(year/400))==0 ) leap = true; // Divisible by 4, 100 and 400 ==> Leap year
                } else {
                    leap = true; // Divisible by 4 but not by 100 ==> Leap year
                }
            }
            // Disable days
            dayField.options[29].disabled = true;
            dayField.options[30].disabled = true;
            if (leap) {
                dayField.options[28].disabled = false;
                if ( dayField.selectedIndex>28 ){
                    dayField.selectedIndex = 28;
                    day_change = 1;
                }
            }else {
                dayField.options[28].disabled = true;
                if ( dayField.selectedIndex>27 ){
                    dayField.selectedIndex = 27;
                    day_change = 1;
                }
            }
            break;
    }
    
    // A return code is assigned as follows:
    //  0: the input date was valid
    // -1: the input year was invalid
    // -2: the day had to be adjusted.
    if (stat!=0){
        return -1;
    }else if (day_change==1){
        return 1;
    }else{
        return 0;
    }
}


/* timeSelectorGet(yearID,monthID,dayID,yearLimits): Retrieves the values from a
       time selector as a dateObj object.
   Inputs:
      yearID:      ID for the year field
      monthID:     ID for the month field
      dayID:       ID for the day field
      yearLimits:  (optional) Array of length 2 with the lower and upper bounds for
                   the year (in that order). If omitted, no limits are applied
   Outputs:
      Returns a dateObj object if input values are correct, and error code -1 otherwise
*/
function timeSelectorGet(yearID,monthID,dayID,yearLimits){
    // Run timeSelectorWatchdog to make sure values are correct.
    // If yearLimits is undefined, it will use the default [-Infinity,Infinity].
    var stat = timeSelectorWatchdog(yearID,monthID,dayID,yearLimits);
    
    if (stat<0){
        // The validation function returned an error condition
        return -1;
    }else{
        var year  = parseFloat(document.getElementById(yearID).value)
          , month = parseFloat(document.getElementById(monthID).selectedIndex)+1
          , day   = parseFloat(document.getElementById(dayID).selectedIndex)+1
        
        return new dateObj(year,month,day);
    }
}


/* PCPInitialize(plotObj,t0,tof,dvarray,levelsStep,colors,DVrange): Initializes a
       pork-chop plot, given a ContourPlot object and the results from a simulation.
   Inputs:
      plotObj:     ContourPlot object
      t0:          Array of departure dates in MJD [days]
      tof:         Array of times of flight [days]
      dvarray:     Array of Delta-v [km/s]
      levelsStep:  Array with the levels for the contour plot, given as the
                   increase in Delta-v wrt the minimum value in dvarray
      colors:      Array with the color descriptor for each contour level
      DVrange:     Range of Delta-V values to be plotted, given as the maximum
                   difference wrt the minimum value in dvarray
*/
function PCPInitialize(plotObj,t0,tof,dvarray,levelsStep,colors,DVrange){
    var i, j, k, nticks=6;

    // Store some values as properties in plotObj.userdata
    plotObj.userdata.t0 = t0;
    plotObj.userdata.tof = tof;
    plotObj.userdata.t0dim = t0.length;
    plotObj.userdata.tofdim = tof.length;
    plotObj.userdata.dvmin = arraymin(dvarray);
    plotObj.userdata.dvmax = plotObj.userdata.dvmin + DVrange;
    // Reshape the Delta-v array as a 'matrix'
    plotObj.userdata.dvmat = Array(plotObj.userdata.t0dim);
    for (k=0; k<plotObj.userdata.t0dim; k++){ 
        plotObj.userdata.dvmat[k] = dvarray.slice(k*plotObj.userdata.tofdim, (k+1)*plotObj.userdata.tofdim);
    }
    
    // Calculate the isobands
    plotObj.userdata.nlevels = levelsStep.length-1;
    plotObj.userdata.levels  = new Array(plotObj.userdata.nlevels+1);
    for (k=0; k<plotObj.userdata.nlevels+1; k++) {
        plotObj.userdata.levels[k]=plotObj.userdata.dvmin+levelsStep[k];
    }
    var bands = new Array(plotObj.userdata.nlevels);
    for (k=0; k<plotObj.userdata.nlevels; k++){
        bands[k] = MarchingSquaresJS.IsoBands( plotObj.userdata.dvmat, plotObj.userdata.levels[k], plotObj.userdata.levels[k+1]-plotObj.userdata.levels[k] );
    }
    

    // Configure the plot object
    
    // X axis:
    // Get the departure date in years
    plotObj.userdata.t0_years = new Array(plotObj.userdata.t0dim);
    for (k=0; k<plotObj.userdata.t0dim; k++){
        plotObj.userdata.t0_years[k] = (plotObj.userdata.t0[k]-58849)/365.25+2020;
    }
    // Set the number of decimal places for the ticks' labels:
    // For departure windows under a week, use four decimal places.
    // For departure windows under a month, use three decimal places.
    // For departure windows under a century, use two decimal places,
    // Otherwise, use one decimal place.
    var Dt0 = plotObj.userdata.t0[plotObj.userdata.t0dim-1] - plotObj.userdata.t0[0];
    if (Dt0<7) {
        plotObj.userdata.xticksdecimals = 4;
    } else if (Dt0<30) {
        plotObj.userdata.xticksdecimals = 3;
    } else if (Dt0<36525) {
        plotObj.userdata.xticksdecimals = 2;
    } else {
        plotObj.userdata.xticksdecimals = 1;
    }
    // Invoke the plotObj.linxaxis method to generate a uniform linear scale
    plotObj.linxaxis( [ plotObj.userdata.t0_years[0], plotObj.userdata.t0_years[plotObj.userdata.t0dim-1] ], nticks, plotObj.userdata.xticksdecimals );

    // Y axis
    // Assume no more than 10000 days, and no less than a 1-day-window.
    // Invoke the plotObj.linyaxis method to generate a uniform linear scale
    plotObj.userdata.yticksdecimals = 1;
    plotObj.linyaxis( [ plotObj.userdata.tof[0], plotObj.userdata.tof[plotObj.userdata.tof.length-1] ], nticks, plotObj.userdata.yticksdecimals );

    
    // The array with the isobands is stored, and the coordinates are normalized.
    plotObj.zaxis.isoband = bands;
    for (i=0; i<plotObj.zaxis.isoband.length; i++) {
        for (j=0; j<plotObj.zaxis.isoband[i].length; j++){
            for (k=0; k<plotObj.zaxis.isoband[i][j].length; k++) {
                plotObj.zaxis.isoband[i][j][k][0] = bands[i][j][k][0]/(plotObj.userdata.t0dim-1);// TODO: Maybe reorder in (X,Y) fashion (and modify ContourPlot accordingly)
                plotObj.zaxis.isoband[i][j][k][1] = bands[i][j][k][1]/(plotObj.userdata.tofdim-1);
            }
        }
    }
    plotObj.zaxis.colors = colors;
    
    // The color bar data is configured
    plotObj.colorbar.plot = true;
    plotObj.colorbar.labels = new Array(plotObj.userdata.nlevels+1);
    for (i=0; i<plotObj.userdata.nlevels+1; i++) {
        plotObj.colorbar.labels[i] = plotObj.userdata.levels[i].toFixed(2);
    }
    plotObj.colorbar.title = "DV [km/s]"
    plotObj.colorbar.wb = 25;
    
    // Plot dimensions are set using the automatic sizing method
    plotObj.updatePlotDimensions();

    // Plot all levels
    plotObj.userdata.currentLevel = plotObj.userdata.nlevels;
    plotObj.draw(plotObj.userdata.currentLevel);
}


/* PCPLevelUpdater(mouseEvent,plotObject): Function to change the plot level of a
       pork-chop plot when the level bar is clicked. Must be added as an onclick
       event to the canvas.
   Inputs:
      mouseEvent:  Object for the onclick event
      plotObject:  ContourPlot object
*/
function PCPLevelUpdater(mouseEvent,plotObject) {

    var plotArea = plotObject.userdata.canvas.getBoundingClientRect()
      , xpos     = mouseEvent.clientX-plotArea.left
      , ypos     = mouseEvent.clientY-plotArea.top
      , colorbar = plotObject.colorbar
      , i;

    if ( (xpos>colorbar.X0)&(xpos<(colorbar.X0+colorbar.wb))&(ypos>colorbar.Yb[colorbar.Yb.length-1]) ) { // pointer clicked inside the color bar
        // Clicked color bar level is checked from top to bottom
        for (i=colorbar.Yb.length-2; i>=0; i--) {
            if ( ypos<colorbar.Yb[i]) {
                // The new plot level is stored, and the plot is updated using
                // the plotObject.draw method
                plotObject.userdata.currentLevel = i+1;
                plotObject.draw(plotObject.userdata.currentLevel);
                break;
            }
        }
    }
}


/* PCPPositionTracker(mouseEvent,plotObject): Function to add a data cursor to a
       pork-chop plot. Must be added as an onmousemove event to the canvas.
   Inputs:
      mouseEvent:  Object for the onmousemove event
      plotObject:  ContourPlot object. It must contain in userdata pointers to the
                   canvas (property 'plotObject.userdata.canvas') and the div
                   (property 'plotObject.userdata.cursorDataBox') where the cursor
                   data will be displayed.
*/
function PCPPositionTracker(mouseEvent,plotObject){
    
    var plotArea = plotObject.userdata.canvas.getBoundingClientRect()
      , xpos     = (mouseEvent.clientX-plotArea.left-plotObject.plotarea.X0)/plotObject.plotarea.DX
      , ypos     = -(mouseEvent.clientY-plotArea.top-plotObject.plotarea.Y0)/plotObject.plotarea.DY
      , i
      , j
      , xval
      , yval
      , zval ;

    // Check if the cursor is within the plotting area
    if ( (xpos>0)&(xpos<1)&(ypos>0)&(ypos<1) ) {
        // Get the horizontal value, based on the x-axis normalized tick positions and label values
        for (i=1; i<plotObject.xaxis.posnorm.length; i++){
            // Run the loop until the tick position immediately higher than the cursor
            // position is found. Compute the x value with a linear interpolation.
            // TODO: Increase accuracy
            if (xpos<plotObject.xaxis.posnorm[i]){
                xval = parseFloat(plotObject.xaxis.value[i-1])+( plotObject.xaxis.value[i]-plotObject.xaxis.value[i-1] )/(plotObject.xaxis.posnorm[i]-plotObject.xaxis.posnorm[i-1])*(xpos-plotObject.xaxis.posnorm[i-1]);
                break;
            }
        }
        // Get the vertical value, based on the y-axis normalized tick positions and label values
        for (j=1; j<plotObject.yaxis.posnorm.length; j++){
            // Run the loop until the tick position immediately higher than the cursor
            // position is found. Compute the y value with a linear interpolation.
            // TODO: Increase accuracy
            if (ypos<plotObject.yaxis.posnorm[j]){
                yval = parseFloat(plotObject.yaxis.value[j-1])+( plotObject.yaxis.value[j]-plotObject.yaxis.value[j-1] )/(plotObject.yaxis.posnorm[j]-plotObject.yaxis.posnorm[j-1])*(ypos-plotObject.yaxis.posnorm[j-1]);
                break;
            }
        }
        
        // Bilinear interpolation to get the z value.
        // Get the departure date interval
        for (i=1; i<plotObject.userdata.t0dim; i++) {
            if (xval<plotObject.userdata.t0_years[i]) break;
        }
        // Get the Time of Flight interval
        for (j=1; j<plotObject.userdata.tofdim; j++) {
            if (yval<plotObject.userdata.tof[j]) break;
        }
        // Perform the bilinear interpolation
        var x1 = plotObject.userdata.t0_years[i-1]
          , x2 = plotObject.userdata.t0_years[i]
          , y1 = plotObject.userdata.tof[j-1]
          , y2 = plotObject.userdata.tof[j];
        zval = ( plotObject.userdata.dvmat[i][j]*(xval-x1)*(yval-y1) + plotObject.userdata.dvmat[i-1][j]*(x2-xval)*(yval-y1) + plotObject.userdata.dvmat[i][j-1]*(xval-x1)*(y2-yval) + plotObject.userdata.dvmat[i-1][j-1]*(x2-xval)*(y2-yval) )/( (x2-x1)*(y2-y1) );
        
        // If z value is within the current plot level, update the cursor data display:
        // TODO: Increase accuracy
        if ( zval<parseFloat(plotObject.colorbar.labels[plotObject.userdata.currentLevel]) ) {
            plotObject.userdata.cursorDataBox.style.display = "block";
            plotObject.userdata.cursorDataBox.innerHTML = "Dep. Date: "+xval.toFixed(2)+" years</br>ToF:    "+yval.toFixed(2)+" days</br>DeltaV: "+zval.toFixed(2)+" km/s";
            plotObject.userdata.cursorDataBox.style.left = (mouseEvent.clientX+20)+"px";
            plotObject.userdata.cursorDataBox.style.top  = (mouseEvent.clientY-30)+"px";
        }else{
            // The cursor data display must not be visible
            plotObject.userdata.cursorDataBox.style.display = "none";
        }
    } else {
    // If mouse is not over the plot area, the cursor data display must not be visible
    plotObject.userdata.cursorDataBox.style.display = "none";
    }
}


/* PCP_Calculate_Plot(transf_type,plotObj1,plotObj2,inputLims): Callback function for
       the 'calculate' buttons. Retrieves/validates the input data and calculates/plots
       the pork-chop plots. If the data retrieval fails, it removes the current plots
       and returns an error code <0.
   Inputs:
      transf_type: 0 - Arrival Delta-v optimization
                   1 - Departure Delta-v optimization
                   2 - Both
      plotObj1:    ContourPlot object for the first plot. It is expected to contain
                   properties 'userdata.plotDiv' (div containing the plot),
                   'userdata.canvas' (canvas for the plot) and
                   'userdata.cursorDataBox' (div for the data cursor)
      plotObj2:    ContourPlot object for the second plot. It is expected to contain
                   the same properties as plotObj1
      inputLims:   Object with the limits for each input field. It must contain
                   properties 'MJD', 'a', 'e', 'i', 'omp', 'RAAN', 'MA0',
                   'DepYear' and 'ToF', and each of them must be an array of
                   length 2 with the lower and upper bounds (in that order)
   Outputs:
      Returns an status code according to the following table:
          0: Success
         -1: Invalid inputs detected (either for orbital elements, departure date
             or time of flight)
         -2: Minimum departure date is later than maximum departure date
         -3: Minimum time of flight is larger than maximum time of flight
*/
function PCP_Calculate_Plot(transf_type,plotObj1,plotObj2,inputLims) {

    // Hide plots during calculations
    plotObj1.userdata.plotDiv.style.display = "none";
    plotObj1.userdata.canvas.style.display = "none";
    plotObj1.userdata.cursorDataBox.style.display = "none";
    plotObj2.userdata.plotDiv.style.display = "none";
    plotObj2.userdata.canvas.style.display = "none";
    plotObj2.userdata.cursorDataBox.style.display = "none";
    
    
    // Recover/validate input values
    var oe0 = getOE("OrbElem0_form",inputLims)
      , oe2 = getOE("OrbElem2_form",inputLims)
      , dep_date_min = timeSelectorGet("DepDateMin_Year","DepDateMin_Month","DepDateMin_Day",inputLims.DepYear)
      , dep_date_max = timeSelectorGet("DepDateMax_Year","DepDateMax_Month","DepDateMax_Day",inputLims.DepYear)
      , dt_min = 0
      , dt_max = 0
      , stat_dt_min = 0
      , stat_dt_max = 0
      , auxvar = [0,0];
    
    auxvar = validateIntegerInput(document.getElementById("dt_min"),inputLims.ToF);
    stat_dt_min = auxvar[0];
    dt_min      = auxvar[1];
    auxvar = validateIntegerInput(document.getElementById("dt_max"),inputLims.ToF);
    stat_dt_max = auxvar[0];
    dt_max      = auxvar[1];
    
    
    // If data validation failed, display an alert and interrupt the
    // computation/plotting returning an error code <0
    if ( oe0===-1 || oe2===-1 || dep_date_min===-1 || dep_date_max===-1 || stat_dt_min!==0 || stat_dt_max!==0  ){
        // Cause of error: Invalid input fields
        alert('Invalid inputs have been detected (an possibly modified). Check your inputs and calculate again.');
        return -1;
    }else if ( dep_date_min.MJD()>=dep_date_max.MJD() ){
        // Cause of error: minimum departure date later than maximum departure date
        alert('Minimum Departure Date cannot be later than Maximum Departure Date.');
        return -2;
    }else if (dt_min>=dt_max){
        // Cause of error: minimum time of flight larger than maximum time of flight
        alert('Minimum Time of Flight cannot be larger than Maximum Time of Flight.');
        return -3;
    }
    
    
    // Canvas objects
    var plotCanvas1 = plotObj1.userdata.canvas
      , plotCanvas2 = plotObj2.userdata.canvas;
    
      
    // Pork-chop plot calculation-related variables
    var levelsStep = [ 0, 0.5, 1, 1.5, 2, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0 ] // Values for the contour levels
      , colors = [ "#4ba7fc", "#3d93ff", "#137bff", "#13ff9b", "#00e785", "#00e01f", "#42c700", "#c76300", "#c71700", "#a40000" ] // Colors for the contour levels
      , ndim = 300 // Grid size in departure time
      , mdim = 300 // Grid size in time of flight
      , DVrange = 5; // Maximum Delta-v range [km/s]
      
      
    // Perform operations corresponding to the selected transfer type
    switch (transf_type) {
        case "0": // Arrival
            // Compute the data for the pork-chop plot
            var dvmax = 2*DVrange + GlobalDVminEstimator(oe0, oe2, dep_date_min, true );
            var pcp = PorkChopAn(oe0, oe2, 0, dep_date_min, dep_date_max, dt_min, dt_max, dvmax , ndim, mdim);
            // Initialize the pork-chop plot
            PCPInitialize(plotObj2,pcp.t0,pcp.tof,pcp.dvmat,levelsStep,colors,DVrange);
            // Add onclick event for the level updater
            plotCanvas2.onclick = function(event) { PCPLevelUpdater(event,plotObj2); }
            // Add onmousemove, onmouseout events for the cursor data box
            plotCanvas2.onmousemove = function(event) { PCPPositionTracker(event,plotObj2); }
            plotCanvas2.onmouseout = function() { plotObj2.userdata.cursorDataBox.style.display = "none"; }
            plotObj2.userdata.canvas.style.display = "inline";
            plotObj2.userdata.plotDiv.style.display = "inline-block";
            break;
        case "1": // Departure
            // Compute the data for the pork-chop plot
            var dvmax = 2*DVrange + GlobalDVminEstimator(oe0, oe2, dep_date_min, false );
            var pcp = PorkChopAn(oe0, oe2, 1, dep_date_min, dep_date_max, dt_min, dt_max, dvmax , ndim, mdim);
            // Initialize the pork-chop plot
            PCPInitialize(plotObj1,pcp.t0,pcp.tof,pcp.dvmat,levelsStep,colors,DVrange);
            // Add onclick event for the level updater
            plotCanvas1.onclick = function(event) { PCPLevelUpdater(event,plotObj1); }
            // Add onmousemove, onmouseout events for the cursor data box
            plotCanvas1.onmousemove = function(event) { PCPPositionTracker(event,plotObj1); }
            plotCanvas1.onmouseout = function() { plotObj1.userdata.cursorDataBox.style.display = "none"; }
            plotObj1.userdata.canvas.style.display = "inline";
            plotObj1.userdata.plotDiv.style.display = "inline-block";
            break;
        case "2": // Both
            // Compute the data for the pork-chop plots
            var dvmax = [ 2*DVrange + GlobalDVminEstimator(oe0, oe2, dep_date_min, true ),
                          2*DVrange + GlobalDVminEstimator(oe0, oe2, dep_date_min, false ) ];
            var pcp = PorkChopAn(oe0, oe2, 2, dep_date_min, dep_date_max, dt_min, dt_max, dvmax , ndim, mdim);
            // Initialize the first pork-chop plot
            PCPInitialize(plotObj1,pcp.t0,pcp.tof,pcp.dvmat_departure,levelsStep,colors,DVrange);
            // Add onclick event for the level updater of the first plot
            plotCanvas1.onclick = function(event) { PCPLevelUpdater(event,plotObj1); }
            // Add onmousemove, onmouseout events for the cursor data box of the first plot
            plotCanvas1.onmousemove = function(event) { PCPPositionTracker(event,plotObj1); }
            plotCanvas1.onmouseout = function() { plotObj1.userdata.cursorDataBox.style.display = "none"; }
            plotObj1.userdata.canvas.style.display  = "inline";
            plotObj1.userdata.plotDiv.style.display = "inline-block";
            // Initialize the second pork-chop plot
            PCPInitialize(plotObj2,pcp.t0,pcp.tof,pcp.dvmat_arrival,levelsStep,colors,DVrange);
            // Add onclick event for the level updater of the second plot
            plotCanvas2.onclick = function(event) { PCPLevelUpdater(event,plotObj2); }
            // Add onmousemove, onmouseout events for the cursor data box of the second plot
            plotCanvas2.onmousemove = function(event) { PCPPositionTracker(event,plotObj2); }
            plotCanvas2.onmouseout = function() { plotObj2.userdata.cursorDataBox.style.display = "none"; }
            plotObj2.userdata.canvas.style.display  = "inline";
            plotObj2.userdata.plotDiv.style.display = "inline-block";
            break;
    }
    // Data retrieval/validation and pork-chop plot calculation/plotting successful
    return 0;
}


/* function(): Onload function. Adds polyfills for some mathematical methods
       (Math.trunc, Math.atanh, Number.isInteger); defines global variables
       OrbElemList (list of celestial bodies) and LambertInputLimits (validity ranges
       for the numerical input fields); initializes plotting objects; and initializes
       input forms (populates the dropdown list of celestial bodies, adds the events
       to validate inputs, and adds the callback functions for the calculate buttons)
*/
window.onload = function() {

    /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      % POLYFILLS. Adds some methods which may be missing in some JS implementations %
      %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/
    // Math.trunc
    Math.trunc = Math.trunc || function(realvar) {
        return (realvar<0 ? Math.ceil(realvar) : Math.floor(realvar));
    }
    // Math.atanh
    Math.atanh = Math.atanh || function(realvar) {
        return 0.5*Math.log( (1+realvar)/(1-realvar) );
    }
    // Number.isInteger
    Number.isInteger = Number.isInteger || function(number) {
        return typeof number === "number" && isFinite(number) && Math.floor(number) === number;
    }
    
    
    /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      % GLOBAL VARIABLES                                                             %
      %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/
    
    /* Celestial Bodies (OrbElemList)
    Array with the list of celestial bodies to be displayed in the dropdown list of
    the UI. Each body is given as an array of the form: [ "name", MJD [days],
    a [AU], e [-], inc [deg], omega [deg], RAAN [deg], MA0 [deg] ]
    */
    OrbElemList = [ [ "Earth", 58849, 1.0000, 1.67e-2, 2.8e-3, 2.87e2, 1.76e2, 3.57e2],
                    [ "Mars", 58849 ,1.52368, 0.0934, 1.85, 2.8543e2, 4.95e1, 2.470695356457666E+02],
                    [ "Mercury", 57475, 3.870988616350284E-01, 2.056202451989101E-01, 7.003967216643477E+00, 2.917217369882490E+01, 4.830994181936381E+01, 3.243851598934714E+02],
                    [ "Jupiter", 57475 ,5.200936530798425E+00, 4.912087220631099E-02, 1.303851038840296E+00, 2.736320597478673E+02, 1.005274597158213E+02, 1.529896661123246E+02],
                    [ "Pluto", 57217 ,3.974504882021532E+01, 2.543193766760227E-01, 1.736672922693450E+01, 1.142276233642205E+02, 1.102097591127033E+02, 3.670529481351401E+01],
                    [ "65803 Didymos", 57200, 1.64, .384 , 3.41, 319 , 73.2, 190],
                    [ "PDC 2015", 57125, 1.78, 0.49,5.35, 313,340,330],
                    [ "PDC 2017", 57802, 2.240639521098204, 6.070001798992910E-01, 6.296906818637476, 3.115542445067025E+02, 2.981305716701033E+02, 3.327185142765978E+02 ],
                    [ "Itokawa", 57475 ,1.324125760914050E+00, 2.801426487519172E-01, 1.621444190534807E+00, 1.628019670038837E+02, 6.908038311617580E+01, 2.812129681786809E+02],
                    [ "Bennu", 57023, 1.126003012501144E+00, 2.036705885543384E-01, 6.034909325983063E+00, 6.628368266949026E+01, 2.035029985296920E+00, 2.267216690674107E+02 ]
                ];

    /* Input Limits (LambertInputLimits)
    Object defining the validity range for each numerical input field. It must contain
    properties 'MJD', 'a', 'e', 'i', 'omp', 'RAAN', 'MA0', 'DepYear' and 'ToF', and each
    of them must be an array of length 2 with the lower and upper bounds (in that order)
    */
    LambertInputLims = { MJD: [36934,88069], a: [0.38,40], e: [0,1], i: [-180,180], omp: [0,360], RAAN: [0,360], MA0: [0,360], DepYear: [1960,2100], ToF: [1,10000] };
    
    
    /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      % INITIALIZE PLOTTING AREAS                                                    %
      %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/
    
    // Set the canvas width to 90% of the available width, with a minimum of 300px and a maximum of 1000px.
    var canvasWidth=document.getElementById('plotDiv1').clientWidth;
    canvasWidth = Math.max(0.9*canvasWidth,300); // Minimum width of 300px
    canvasWidth = Math.min(canvasWidth,1000); // Maximum width of 1000px
    
    // Initialize plotting area 1
    // Set canvas geometry
    var plotCanvas1 = document.getElementById('plotCanvas1');
    plotCanvas1.width  = canvasWidth;
    plotCanvas1.height = canvasWidth;
    plotCanvas1.style.width  = canvasWidth;
    plotCanvas1.style.height = canvasWidth;
    // Create ContourPlot object, and store additional properties in 'userdata'
    var plotObject1 = new ContourPlot(plotCanvas1.getContext('2d'));
    plotObject1.userdata.canvas = plotCanvas1;
    plotObject1.userdata.cursorDataBox = document.getElementById('floatText1');
    plotObject1.userdata.plotDiv = document.getElementById('plotDiv1');
    plotObject1.userdata.canvas.style.display = "none";
    plotObject1.userdata.cursorDataBox.style.display = "none";
    plotObject1.userdata.plotDiv.style.display = "none";

    // Initialize plotting area 2
    // Set canvas geometry
    var plotCanvas2 = document.getElementById('plotCanvas2');
    plotCanvas2.width  = canvasWidth;
    plotCanvas2.height = canvasWidth;
    plotCanvas2.style.width  = canvasWidth;
    plotCanvas2.style.height = canvasWidth;
    // Create ContourPlot object, and store additional properties in 'userdata'
    var plotObject2 = new ContourPlot(plotCanvas2.getContext('2d'));
    plotObject2.userdata.canvas = plotCanvas2;
    plotObject2.userdata.cursorDataBox = document.getElementById('floatText2');
    plotObject2.userdata.plotDiv = document.getElementById('plotDiv2');
    plotObject2.userdata.canvas.style.display = "none";
    plotObject2.userdata.cursorDataBox.style.display = "none";
    plotObject2.userdata.plotDiv.style.display = "none";

    
    /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      % INITIALIZE INPUT FORMS                                                       %
      %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/
    
    // Populate the OE lists
    populateOEList("OrbElem0_bodyList",OrbElemList);
    populateOEList("OrbElem2_bodyList",OrbElemList);

    // Set default cases. Starting from 0, cases are 'Custom' + Celestial Bodies in OrbElemList (in their respective order).
    document.getElementById("OrbElem0_bodyList").options[1].selected = true; // Earth
    document.getElementById("OrbElem2_bodyList").options[2].selected = true; // Mars

    // Update form values
    updateOE("OrbElem0_form","OrbElem0_bodyList",OrbElemList);
    updateOE("OrbElem2_form","OrbElem2_bodyList",OrbElemList);


    // Add events for case change
    document.getElementById("OrbElem0_bodyList").onchange = function() { updateOE("OrbElem0_form","OrbElem0_bodyList",OrbElemList); }
    document.getElementById("OrbElem2_bodyList").onchange = function() { updateOE("OrbElem2_form","OrbElem2_bodyList",OrbElemList); }


    // Add events for date change
    // Minimum departure date
    document.getElementById("DepDateMin_Year").onchange  = function() { timeSelectorWatchdog("DepDateMin_Year","DepDateMin_Month","DepDateMin_Day",LambertInputLims.DepYear) };
    document.getElementById("DepDateMin_Year").onfocus   = function() { this.oldValue = this.value; }
    document.getElementById("DepDateMin_Month").onchange = function() { timeSelectorWatchdog("DepDateMin_Year","DepDateMin_Month","DepDateMin_Day",LambertInputLims.DepYear) };
    document.getElementById("DepDateMin_Day").onchange   = function() { timeSelectorWatchdog("DepDateMin_Year","DepDateMin_Month","DepDateMin_Day",LambertInputLims.DepYear) };
    // Maximum departure date
    document.getElementById("DepDateMax_Year").onchange  = function() { timeSelectorWatchdog("DepDateMax_Year","DepDateMax_Month","DepDateMax_Day",LambertInputLims.DepYear) };
    document.getElementById("DepDateMax_Year").onfocus   = function() { this.oldValue = this.value; }
    document.getElementById("DepDateMax_Month").onchange = function() { timeSelectorWatchdog("DepDateMax_Year","DepDateMax_Month","DepDateMax_Day",LambertInputLims.DepYear) };
    document.getElementById("DepDateMax_Day").onchange   = function() { timeSelectorWatchdog("DepDateMax_Year","DepDateMax_Month","DepDateMax_Day",LambertInputLims.DepYear) };
    
    // Add events for time of flight change
    document.getElementById("dt_min").onchange = function() { validateIntegerInput(this,LambertInputLims.ToF); }
    document.getElementById("dt_min").onfocus  = function() { this.oldValue = this.value; }
    document.getElementById("dt_max").onchange = function() { validateIntegerInput(this,LambertInputLims.ToF); }
    document.getElementById("dt_max").onfocus  = function() { this.oldValue = this.value; }
    

    // Add events to validate user input whenever the fields are updated
    document.getElementById("OrbElem0_form").elements["MJD"].onchange = function() { validateIntegerInput(this,LambertInputLims.MJD); }
    document.getElementById("OrbElem0_form").elements["MJD"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["a"].onchange = function() { validateRealInput(this,LambertInputLims.a); }
    document.getElementById("OrbElem0_form").elements["a"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["e"].onchange = function() { validateRealInput(this,LambertInputLims.e); }
    document.getElementById("OrbElem0_form").elements["e"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["inc"].onchange = function() { validateRealInput(this,LambertInputLims.i); }
    document.getElementById("OrbElem0_form").elements["inc"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["omp"].onchange = function() { validateRealInput(this,LambertInputLims.omp); }
    document.getElementById("OrbElem0_form").elements["omp"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["RAAN"].onchange = function() { validateRealInput(this,LambertInputLims.RAAN); }
    document.getElementById("OrbElem0_form").elements["RAAN"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem0_form").elements["MA0"].onchange = function() { validateRealInput(this,LambertInputLims.MA0); }
    document.getElementById("OrbElem0_form").elements["MA0"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["MJD"].onchange = function() { validateIntegerInput(this,LambertInputLims.MJD); }
    document.getElementById("OrbElem2_form").elements["MJD"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["a"].onchange = function() { validateRealInput(this,LambertInputLims.a); }
    document.getElementById("OrbElem2_form").elements["a"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["e"].onchange = function() { validateRealInput(this,LambertInputLims.e); }
    document.getElementById("OrbElem2_form").elements["e"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["inc"].onchange = function() { validateRealInput(this,LambertInputLims.i); }
    document.getElementById("OrbElem2_form").elements["inc"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["omp"].onchange = function() { validateRealInput(this,LambertInputLims.omp); }
    document.getElementById("OrbElem2_form").elements["omp"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["RAAN"].onchange = function() { validateRealInput(this,LambertInputLims.RAAN); }
    document.getElementById("OrbElem2_form").elements["RAAN"].onfocus = function() { this.oldValue = this.value; }
    document.getElementById("OrbElem2_form").elements["MA0"].onchange = function() { validateRealInput(this,LambertInputLims.MA0); }
    document.getElementById("OrbElem2_form").elements["MA0"].onfocus = function() { this.oldValue = this.value; }
 
    
    // Events for calculating the Pork Chop Plots when requested
    document.getElementById("porkChopPlot_departure").onclick = function() { PCP_Calculate_Plot("1",plotObject1,plotObject2,LambertInputLims); }
    document.getElementById("porkChopPlot_arrival").onclick = function() { PCP_Calculate_Plot("0",plotObject1,plotObject2,LambertInputLims); }
    document.getElementById("porkChopPlot_both").onclick = function() { PCP_Calculate_Plot("2",plotObject1,plotObject2,LambertInputLims); }

}
