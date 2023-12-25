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

 File:                     ContourPlot.js
 Programmed By:            Juan Luis Gonzalo Gómez
 Last Modification:        08/07/2017 (Added comments, no changes in code)
 Description:              Defines a class for plotting contour graphs,
                           using HTML5 canvas element and standard plotting
                           primitives.

Classes:
     ContourPlot:       Custom contour graph object, based on HTML5 canvas
                        element and standard plotting primitives.


****************************************************************************/


"use strict";

 /* ContourPlot: Custom contour graph object, based on HTML5 canvas element
           and standard plotting primitives.
   Inputs (for constructor):
      ctx:  2D drawing context on the canvas element where the contour graph
            will be plotted. Can be retrieved with the method
            canvas.getContext('2d')
   Properties:
      context:     Canvas 2D drawing context
      label:       Object with information about the labels
         font:     Font descriptor for the labels
         ytext:    Text for the y-axis label
         ysep:     Horizontal separation between the y-axis and its label
         xtext:    Text for the x-axis label
         xsep:     Vertical separation between the x-axis and its label
      borderwidth: Width of the plotting area border
      gridwidth:   Width of the gridlines
      tick:        Object with information about the ticks
         width:    Tick's width
         length:   Tick's length
         font:     Tick's font descriptor
      xaxis:       Object with information about the tick values in the x-axis
         posnorm:  Array with the position of the x-axis ticks, in normalized [0,1] domain
         value:    Array with the values of the x-axis ticks
      yaxis:       Object with information about the tick values in the y-axis
         posnorm:  Array with the position of the y-axis ticks, in normalized [0,1] domain
         value:    Array with the values of the y-axis ticks
      zaxis:       Object with information about the z-axis
         colors:   Array with color descriptors for the contour levels (must use
                   an HTML/CSS valid syntax)
         isobands: Array containing the isobands. See detailed information on how
                   to define the isobands at the end of this documentation
      plotarea:    Object containing the geometric properties of the plotting area
         X0:       Horizontal position for the bottom-left corner of the plotting area
                   (wrt the top-left corner of the canvas)
         Y0:       Vertical position for the bottom-left corner of the plotting area
                   (wrt the top-left corner of the canvas)
         DX:       Width of the plotting area
         DY:       Height of the plotting area
      colorbar:    Object containing the properties of the color bar
         plot:     Boolean indicating if the color bar will be plotted (true) or
                   not (false)
         title:    Title string for the color bar
         labels:   Array of strings with the labels for the color bar
         font:     Color bar's font descriptor.
         X0:       Horizontal position for the bottom-left corner of the color bar
                   plotting area (including labels and title), wrt the top-left
                   corner of the canvas
         Y0:       Vertical position for the bottom-left corner of the color bar
                   plotting area (including labels and title), wrt the top-left
                   corner of the canvas
         DX:       Width of the color bar plotting area (including labels and title)
         DY:       Height of the color bar plotting area (including labels and title)
         Yb:       Array with the vertical positions of the bottom borders of
                   the rectangles for each level in the color bar (wrt the top-left 
                   corner of the canvas). Last value is the position of the top border 
                   for the highest level. These positions are also used for placing
                   the labels.
         wb:       Width of the color bar
         labsep:   Horizontal separation of the labels wrt the right border of the 
                   color bar plotting area (label text is right-aligned)
      userdata:    Object for storing user-defined data
   Methods:
     labelem():    Returns the width of an "m" letter for the label's font
     tickem():     Returns the width of an "m" letter for the tick's font
     colorbarem(): Returns the width of an "m" letter for the color bar's font
     linxaxis(range,nticks,decimals): Sets xaxis.posnorm and xaxis.values
                   properties for a uniform linear scale with nticks between range[0]
                   and range[1], using a fixed number of decimal positions for writing
                   the labels.
         Inputs:
            range:    Array of length two with the lower and upper limits of the xaxis
            nticks:   Number of ticks for the xaxis
            decimals: Number of decimal positions for the numbers in the tick's labels
     linyaxis(range,nticks,decimals): Sets yaxis.posnorm and yaxis.values
                   properties for a uniform linear scale with nticks between range[0]
                   and range[1], using a fixed number of decimal positions for writing
                   the labels.
         Inputs:
            range:    Array of length two with the lower and upper limits of the yaxis
            nticks:   Number of ticks for the yaxis
            decimals: Number of decimal positions for the numbers in the tick's labels
     updatePlotDimensions(): Updates contour object dimensions (plotarea.{X0, Y0,
                      DX, DY}, colorbar.{X0, Y0, DX, DY, Yb, wb, labsep},
                      label.{xsep, ysep}) based on current canvas size, fonts and
                      labels (for axis, ticks and color bar).
     draw(plotlevels): Draws the contour graph for the current properties and
                      a given level of contour lines
         Inputs:
            plotlevels:   (optional) number of contour levels to plot, as defined
                          in the zaxis property. If omitted, all levels are plotted.
     

Property "zaxis.isobands" contains the isobands as a set of nested arrays with the
following levels:
1) Each array at the outermost level contains all the isobands for a given contour level
    2) Each array at the second level corresponds to a single isoband
        3) Each array at the third level corresponds to a path point of its parent isoband,
           given as [ y_coordinate, x_coordiante ]. Note the reversed ordering of the
           coordinates.

*/
function ContourPlot(ctx) {
    // Store the canvas 2D drawing context
    this.context      = ctx;
    // Set default values for the object properties (see their definition
    // in the class description above)
    this.label        = { font:   "16px serif",
                          ytext:  "Time of Flight [days]",
                          ysep:   0.05*ctx.canvas.width,
                          xtext:  "Departure Date [years]",
                          xsep:   0.05*ctx.canvas.height };
    this.borderwidth  = 3;
    this.gridwidth    = 0.5;
    this.tick         = { width:    2,
                          length:   6,
                          font:     "12px sans-serif" };
    this.xaxis        = { posnorm: [ 0, 0.5, 1 ],
                          value:   [ 0, 0.5, 1 ] };
    this.yaxis        = { posnorm: [ 0, 0.5, 1 ],
                          value:   [ 0, 0.5, 1 ] };
    this.zaxis        = { colors:  [ "black", "white" ],
                          isoband: [ [ [ [ 0, 0], [ 0, 1], [1, 1], [1, 0] ] ], [ [ [0.25, 0.25 ], [0.25, 0.75], [0.75, 0.75], [0.75, 0.25] ] ] ] };
    this.plotarea     = { X0:      0.2*ctx.canvas.width,
                          Y0:      0.8*ctx.canvas.height,
                          DX:      0.7*ctx.canvas.width,
                          DY:      0.7*ctx.canvas.height};
    this.colorbar     = { plot:    false,
                          title:   "",
                          labels:  [ ],
                          font:    "12px sans-serif",
                          X0:      0,
                          Y0:      0,
                          DX:      0,
                          DY:      0,
                          Yb:      [ ],
                          wb:      0,
                          labsep:  0  };
    this.userdata     = {}; // Empty field for user-defined data
}


ContourPlot.prototype = {
    // labelem(): Returns the width of an "m" letter for the label's font
    labelem: function() {
        this.context.save();
        this.context.font = this.label.font;
        var msize = this.context.measureText("m").width;
        this.context.restore();
        return msize;
    },
    // tickem(): Returns the width of an "m" letter for the tick's font
    tickem: function() {
        this.context.save();
        this.context.font = this.tick.font;
        var msize = this.context.measureText("m").width;
        this.context.restore();
        return msize;
    },
    // colorbarem(): Returns the width of an "m" letter for the color bar's font
    colorbarem: function() {
        this.context.save();
        this.context.font = this.colorbar.font;
        var msize = this.context.measureText("m").width;
        this.context.restore();
        return msize;
    },
    /* linxaxis(range,nticks,decimals): Sets xaxis.posnorm and xaxis.values
           properties for a uniform linear scale with nticks between range[0]
           and range[1], using a fixed number of decimal positions for writing
           the labels.
       Inputs:
          range:    Array of length two with the lower and upper limits of the xaxis
          nticks:   Number of ticks for the xaxis
          decimals: Number of decimal positions for the numbers in the tick's labels
    */
    linxaxis: function(range,nticks,decimals) {
        this.xaxis.posnorm = new Array(nticks);
        this.xaxis.values = new Array(nticks);
        var x0 = range[0]
          , dp = 1/(nticks-1)
          , Dx = (range[1]-range[0])*dp;
        for (var i=0; i<nticks; i++){
            this.xaxis.posnorm[i] = i*dp;
            this.xaxis.value[i] = (x0+i*Dx).toFixed(decimals)
        }
    
    },
    /* linyaxis(range,nticks,decimals): Sets yaxis.posnorm and yaxis.values
           properties for a uniform linear scale with nticks between range[0]
           and range[1], using a fixed number of decimal positions for writing
           the labels.
       Inputs:
          range:    Array of length two with the lower and upper limits of the yaxis
          nticks:   Number of ticks for the yaxis
          decimals: Number of decimal positions for the numbers in the tick's labels
    */
    linyaxis: function(range,nticks,decimals) {
        this.yaxis.posnorm = new Array(nticks);
        this.yaxis.values = new Array(nticks);
        var y0 = range[0]
          , dp = 1/(nticks-1)
          , Dy = (range[1]-range[0])*dp;
        for (var i=0; i<nticks; i++){
            this.yaxis.posnorm[i] = i*dp;
            this.yaxis.value[i] = (y0+i*Dy).toFixed(decimals)
        }
    },
    /* updatePlotDimensions(): Updates contour object dimensions
           (plotarea.{X0, Y0, DX, DY}, colorbar.{X0, Y0, DX, DY, Yb, wb, labsep},
           label.{xsep, ysep}) based on current canvas size, fonts and
           labels (for axis, ticks and color bar).
    */
    updatePlotDimensions: function() {
        
        // Retrieve global dimensions
        var canwidth  = this.context.canvas.width;
        var canheight = this.context.canvas.height;

        // Reference sizes for axis labels and ticks values
        var labelem = this.labelem();
        var ticksem = this.tickem();

        // Reference sizes for x and y ticks values
        this.context.save();
        this.context.font = this.tick.font;
        var xtickvaluewidth = Math.max( this.context.measureText(this.xaxis.value[0]).width, this.context.measureText(this.xaxis.value[this.xaxis.value.length-1]).width );
        var ytickvaluewidth = Math.max( this.context.measureText(this.yaxis.value[0]).width, this.context.measureText(this.yaxis.value[this.yaxis.value.length-1]).width );
        
        
        // Update vertical plot area sizes
        this.plotarea.Y0 = canheight - 1.2*ticksem - 2.7*labelem; // 1.2[em] for title, 1.5[em] for slacks
        this.plotarea.DY = this.plotarea.Y0 - ticksem - 0.5*labelem; // height to origin - height of Y upmost tick text - additional slack
        
        
        //  If colorbar has been requested, update its dimensions
        if (this.colorbar.plot) {
            var colorbarem = this.colorbarem();
            if (this.colorbar.wb<=0) this.colorbar.wb=10;
            this.context.font = this.colorbar.font;
            var colorvaluewidth = Math.max( this.context.measureText(this.colorbar.labels[0]).width, this.context.measureText(this.colorbar.labels[this.colorbar.labels.length-1]).width );
            this.colorbar.labsep = 0.5*colorbarem;
            var colorbarwidth = this.colorbar.wb + colorvaluewidth + colorbarem;
            this.colorbar.X0 = canwidth - colorbarwidth;
            this.colorbar.DX = colorbarwidth;
            this.colorbar.Y0 = this.plotarea.Y0;
            this.colorbar.DY = this.plotarea.DY;
            var nlevels = this.zaxis.colors.length
              , blockheight = (this.colorbar.DY - 3*colorbarem)/nlevels;
            this.colorbar.Yb = new Array(nlevels+1);
            for (var i=0; i<=nlevels; i++) {
                this.colorbar.Yb[i] = this.colorbar.Y0 - 0.5*colorbarem - i*blockheight;
            }
        }else{
            var colorbarwidth = 0;            
        }

        
        // Update horizontal plot area sizes
        this.plotarea.X0 = ytickvaluewidth + 2.7*labelem; // 1.2[em] for title, 1.5[em] for slacks
        this.plotarea.DX = canwidth - this.plotarea.X0 - xtickvaluewidth/2 - 0.5*labelem - colorbarwidth; // total width - axis X origin - slack for the last tick label - additional slack - width of colorbar
        
        // Update axis separation from the plot box
        this.label.xsep  = 2*ticksem + labelem;
        this.label.ysep  = ytickvaluewidth + labelem;
        
        
        this.context.restore();
        
    },
    /* draw(plotlevels): Draws the contour graph for the current properties and
           a given level of contour lines
    Inputs:
    plotlevels:   (optional) number of contour levels to plot, as defined in the
                  zaxis property. If omitted, all levels are plotted.
    */
    draw: function(plotlevels) {
        // Store canvas dimensions
        var canwidth  = this.context.canvas.width
          , canheight = this.context.canvas.height;
          
        // Clear the canvas
        this.context.clearRect(0, 0, canwidth, canheight );
        
        // Plot the isobands first
        var nlevels = plotlevels || this.zaxis.isoband.length;
        for (var i=nlevels; i>0; i--){
            var band = this.zaxis.isoband[i-1];
            this.context.fillStyle = this.zaxis.colors[i-1];
            this.context.strokeStyle = this.zaxis.colors[i-1];
            // Each area is plotted as a path
            for (var j=0; j<band.length; j++){
                this.context.beginPath();
                this.context.moveTo( this.plotarea.X0+band[j][0][1]*this.plotarea.DX, this.plotarea.Y0-band[j][0][0]*this.plotarea.DY );
                for (var k=0; k<band[j].length; k++) {
                    this.context.lineTo( this.plotarea.X0+band[j][k][1]*this.plotarea.DX, this.plotarea.Y0-band[j][k][0]*this.plotarea.DY );
                }
                this.context.lineTo( this.plotarea.X0+band[j][0][1]*this.plotarea.DX, this.plotarea.Y0-band[j][0][0]*this.plotarea.DY );
                this.context.fill();
                this.context.stroke();
            }
        }
        
        // Plot borders
        this.context.fillStyle = "black";
        this.context.strokeStyle = "black";
        this.context.lineWidth = this.borderwidth;
        this.context.strokeRect(this.plotarea.X0,this.plotarea.Y0,this.plotarea.DX,-this.plotarea.DY);
        
        // Vertical grid lines and ticks
        for (var i=0; i<this.xaxis.posnorm.length; i++){
            // Grid line
            this.context.lineWidth = this.gridwidth;
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0);
            this.context.lineTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0-this.plotarea.DY);
            this.context.stroke();
            // Lower tick
            this.context.lineWidth = this.tick.width;
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0);
            this.context.lineTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0-this.tick.length);
            this.context.stroke();
            // Upper tick
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0-this.plotarea.DY);
            this.context.lineTo(this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0-this.plotarea.DY+this.tick.length);
            this.context.stroke();
        }
        
        // Horizontal grid lines and ticks
        for (var i=0; i<this.yaxis.posnorm.length; i++){
            // Grid line
            this.context.lineWidth = this.gridwidth;
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.lineTo(this.plotarea.X0+this.plotarea.DX,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.stroke();
            // Leftmost tick
            this.context.lineWidth = this.tick.width;
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.lineTo(this.plotarea.X0+this.tick.length,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.stroke();
            // Rightmost tick
            this.context.beginPath();
            this.context.moveTo(this.plotarea.X0+this.plotarea.DX,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.lineTo(this.plotarea.X0+this.plotarea.DX-this.tick.length,this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY);
            this.context.stroke();
        }
        
        // Tick values
        this.context.font = this.tick.font;
        var tickem = this.tickem();
        // X axis ticks
        this.context.textAlign = "center";
        for (var i=0; i<this.xaxis.value.length; i++){
            this.context.fillText(this.xaxis.value[i], this.plotarea.X0+this.xaxis.posnorm[i]*this.plotarea.DX, this.plotarea.Y0+1.5*tickem );
        }
        // Y axis ticks
        this.context.textAlign = "end";
        for (var i=0; i<this.yaxis.value.length; i++){
            this.context.fillText(this.yaxis.value[i], this.plotarea.X0-tickem, this.plotarea.Y0-this.yaxis.posnorm[i]*this.plotarea.DY );
        }


        // Write axis labels
        this.context.font = this.label.font;
        this.context.textAlign = "center";
        this.context.fillText(this.label.xtext, this.plotarea.X0+this.plotarea.DX/2, this.plotarea.Y0+this.label.xsep );
        this.context.save();
        this.context.rotate(-Math.PI/2);
        this.context.fillText(this.label.ytext, -this.plotarea.Y0+this.plotarea.DY/2, this.plotarea.X0-this.label.ysep );
        this.context.restore();
        
        
        // If requested, plot the color bar
        if (this.colorbar.plot) {
            // Plot the color bar as a set of colored rectangles (one per level)
            var colorbarem = this.colorbarem();
            this.context.font = this.colorbar.font;
            for (var i=0; i<this.colorbar.Yb.length-1; i++) {
                this.context.lineWidth = 1;
                this.context.fillStyle = this.zaxis.colors[i];
                this.context.fillRect(this.colorbar.X0, this.colorbar.Yb[i], this.colorbar.wb, this.colorbar.Yb[i+1]-this.colorbar.Yb[i] );
            }
            // Write level labels
            this.context.fillStyle = "black";
            this.context.textAlign = "right";
            var colorlabelxright = this.colorbar.X0+this.colorbar.DX-this.colorbar.labsep;
            for (var i=0; i<this.colorbar.Yb.length; i++){
                this.context.fillText(this.colorbar.labels[i], colorlabelxright , this.colorbar.Yb[i]+0.5*colorbarem );
            }
            // Write title
            this.context.textAlign = "center";
            this.context.fillText(this.colorbar.title, this.colorbar.X0+this.colorbar.DX/2 , this.colorbar.Yb[this.colorbar.Yb.length-1]-colorbarem );
            
        }
        
    }
}
