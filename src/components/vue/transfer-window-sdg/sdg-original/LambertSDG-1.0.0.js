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

 File:                     LambertSDG.js
 Programmed By:            Juan Luis Gonzalo Gómez
 Last Modification:        08/07/2017 (Added comments, no changes in code)
 Description:              Contains objects and procedures for computing a
       pork-chop plot using the approximate analytical method propossed in:
       - "Approximate Analytical Solution of the Lambert's Targeting Problem."
         Claudio Bombardelli, Juan Luis Gonzalo, Javier Roa. In Journal of Guidance,
         Control and Dynamics (submitted). 2017.
       - "Approximate Analytical Solution of the Lambert's Targeting Problem."
         Claudio Bombardelli, Javier Roa, Juan Luis Gonzalo. Paper AAS 16-212 in
         26th AAS/AIAA Space Flight Mechanics Meeting, Napa, CA, USA, 14-18 February 2016.

         
Global variables:
     AU_in_km:    Astronomical Unit in km
     muSUN:       Sun's gravitational parameter
     mu:          Primary's gravitational parameter
     deg2rad:     Degrees-to-radians conversion factor
     inv_mu:      inverse of mu
     sqrt_mu:     square root of mu
     
Classes:
     Vector3D:          3D vector object
     OrbitalElements:   Orbital Elements object
     dateObj:           Full date object
     
Functions:
    M2E:                  Converts from mean to eccentric anomaly by solving Kepler's
                          equation with Newton's method.
    QuarticRoot:          Iterative solver for Battin's quartic equation
                          x^4-P*x^3+Q*x-1=0, for the root closest to x=1.
    SingleImpulseDvOpt:   Solves the single-impulse time-free transfer.
    LambertAn:            Approximate analytical solver for Lambert's problem
    GlobalDVminEstimator: Computes a fast estimation of the global minimum
                          Delta-v, for a time range defined by a minimum departure
                          date and the synodic period.
    PorkChopAn:           Computes the pork-chop plot for given departure and arrival
                          orbital elements, a range of departure times [tdep_min,tdep_max],
                          and a range of times of flights [dt_min,dt_max], using the
                          approximate analytical solution implemented in function LambertAn.


****************************************************************************/


"use strict";

// **************************************************************************
//  GLOBAL VARIABLES

var AU_in_km = 149597870.691;  // Astronomical Unit in km

var muSUN    = 2.959122082855911E-04 * Math.pow(AU_in_km,3) / Math.pow(24*3600,2); // Sun's gravitational parameter

var mu = muSUN; // Primary's gravitational parameter

var deg2rad = Math.PI/180; // Degrees-to-radians conversion factor

var inv_mu   = 1/mu              // inverse of mu
  , sqrt_mu  = Math.sqrt(mu);    // square root of mu


// **************************************************************************
//  CUSTOM CLASSES
  
/* Vector3D: 3D vector object
   Inputs (for constructor):
      x:    x coordinate
      y:    y coordinate
      z:    z coordinate
   Properties:
      x:    x coordinate
      y:    y coordinate
      z:    z coordinate
   Methods:
     dot(v):       Returns the dot product with v. If v is an scalar, output is
                   a Vector3D object. If v is a Vector3D, output is an scalar.
     cross(v):     Returns the cross product with v. Both v and the output
                   are Vector3D objects.
     add(v):       Returns the addition with v (scalar or Vector3D). The
                   output is a Vector3D object.
     substract(v): Returns the substraction with v (scalar or Vector3D).
                   The output is a Vector3D object.
     norm():       Returns the norm (scalar) of the Vector3D object.
     opposite():   Returns the opposite of the Vector3D object.
*/
function Vector3D(x,y,z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

Vector3D.prototype = {
  // dot(v): Returns the dot product with v. If v is an scalar, output is
  //     a Vector3D object. If v is a Vector3D, output is an scalar.
  dot: function(v) {
    if (v instanceof Vector3D ) {
      return this.x*v.x+this.y*v.y+this.z*v.z;
    } else {
      return new Vector3D(this.x*v,this.y*v,this.z*v);
    }
  },
  // cross(v): Returns the cross product with v. Both v and the output
  //     are Vector3D objects.
  cross: function(v) {
    return new Vector3D( this.y*v.z-this.z*v.y, -this.x*v.z+this.z*v.x, this.x*v.y-this.y*v.x );
  },
  // add(v): Returns the addition with v (scalar or Vector3D). The
  //     output is a Vector3D object.
  add: function(v) {
    if (v instanceof Vector3D ) {
      return new Vector3D( this.x+v.x, this.y+v.y, this.z+v.z );
    } else {
      return new Vector3D( this.x+v, this.y+v, this.z+v );
    }
  },
  // substract(v): Returns the substraction with v (scalar or Vector3D).
  //     The output is a Vector3D object.
  substract: function(v) {
    if (v instanceof Vector3D ) {
      return new Vector3D( this.x-v.x, this.y-v.y, this.z-v.z );
    } else {
      return new Vector3D( this.x-v, this.y-v, this.z-v );
    }
  },
  // norm(): Returns the norm (scalar) of the Vector3D object.
  norm: function() {
    return Number(Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z));
  },
  // opposite(): Returns the opposite of the Vector3D object.
  opposite: function() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return;
  }
}


/* OrbitalElements: Orbital Elements object
   Inputs (for constructor):
      MJD:    Modified Julian Date [days]
      a:      semimajor axis [AU]
      e:      eccentricity [-]
      i:      inclination [deg]
      omp:    argument of perigee [deg]
      RAAN:   right ascension of the ascending node [deg]
      MA0:    mean anomaly [deg]
   Properties:
      MJD:    Modified Julian Date [days]
      a:      semimajor axis [km]
      e:      eccentricity [-]
      i:      inclination [rad]
      omp:    argument of perigee [rad]
      RAAN:   right ascension of the ascending node [rad]
      MA0:    mean anomaly [rad]
      n:      mean motion [rad/s]
      b:      b parameter for the conic [km]
      PF2ECI: matrix for converting from perifocal frame to ECI
   Methods:
     rv(MVD): Returns position r and velocity v (both Vector 3D objects)
              for a given date MJD (scalar).
*/
function OrbitalElements(MJD,a,e,i,omp,RAAN,MA0) {
   this.MJD  = MJD;
   this.a    = a*AU_in_km;
   this.e    = e;
   this.i    = i*deg2rad;
   this.omp  = omp*deg2rad;
   this.RAAN = RAAN*deg2rad;
   this.MA0  = MA0*deg2rad;

   this.n    = Math.sqrt( muSUN/Math.pow(this.a,3) ); // In rad/s
   this.b    = this.a*Math.sqrt(1-e*e);

   // Perifocal to ECI
   var com = Math.cos(this.RAAN);
   var som = Math.sin(this.RAAN);
   var cop = Math.cos(this.omp);
   var sop = Math.sin(this.omp);
   var ci  = Math.cos(this.i);
   var si  = Math.sin(this.i);

   this.PF2ECI = [ [ com*cop-som*sop*ci, -com*sop-som*cop*ci, som*si ], [ som*cop+com*sop*ci, -som*sop+com*cop*ci, -com*si ], [ sop*si, cop*si, ci ] ];
}

// rv(MVD): Returns position r and velocity v (both Vector 3D objects)
//     for a given date MJD (scalar).
OrbitalElements.prototype.rv = function(MJD) {

   var MA       = this.MA0 + this.n*(MJD-this.MJD)*86400;

   // Conversion from mean anomaly to eccentric anomaly via Kepler's equation
   var EA =  M2E(WrapTo2pi(MA),this.e); // Improve the Kepler, maybe some initiallization

   var cea      = Math.cos(EA);
   var sea      = Math.sin(EA);
   var xper     = this.a*(cea-this.e);
   var yper     = this.b*sea;
   var ydotper  = this.n/(1-this.e*cea);  // Temporary storage
   var xdotper  = -this.a*sea*ydotper;
   ydotper      = this.b*cea*ydotper;


   // Rotate from Perifocal to ECI
   var rx = this.PF2ECI[0][0]*xper + this.PF2ECI[0][1]*yper;
   var ry = this.PF2ECI[1][0]*xper + this.PF2ECI[1][1]*yper;
   var rz = this.PF2ECI[2][0]*xper + this.PF2ECI[2][1]*yper;

   var vx = this.PF2ECI[0][0]*xdotper + this.PF2ECI[0][1]*ydotper;
   var vy = this.PF2ECI[1][0]*xdotper + this.PF2ECI[1][1]*ydotper;
   var vz = this.PF2ECI[2][0]*xdotper + this.PF2ECI[2][1]*ydotper;
   
   return{r: new Vector3D(rx,ry,rz), v: new Vector3D(vx,vy,vz) };

}


/* dateObj: Full date object
   Inputs (for constructor):
      year:   year (integer)
      month:  month (integer)
      day:    day (integer)
   Properties:
      year:   year (integer)
      month:  month (integer)
      day:    day (integer)
   Methods:
     MJD():   Returns the MJD [days]
*/
function dateObj(year,month,day){
    // Input values must be integers. We round them if not
    this.year  = Math.round(parseFloat(year));
    this.month = Math.round(parseFloat(month));
    this.day   = Math.round(parseFloat(day));
}

// MJD(): Returns the MJD [days]
dateObj.prototype.MJD = function() { // Modified Julian Date calculation
    var iyyy = this.year;

    if (iyyy<0) iyyy=iyyy+1; // Because there is no year 0
    if (this.month>2) {
        var jy=iyyy
          , jm=this.month+1;
    }else{
        var jy=iyyy-1
          , jm=this.month+13;
    }
    var julday = Math.trunc(365.25*jy)+Math.trunc(30.6001*jm)+this.day+1720995
      , igreg=588829; //igreg=15+31*(10+12*1582)
    if (this.day+31*(this.month+12*iyyy)>=igreg){
        var ja = Math.trunc(0.01*jy);
        julday = julday+2-ja+Math.trunc(0.25*ja);
    }
    julday = julday -2400001;
    return julday;
}



// **************************************************************************
// AUXILIAR FUNCTIONS

/* WrapTo2pi(theta): wraps an angle to the [0,2pi] range
   Inputs:
      theta:  angle [rads]
   Output:
      Angle in the [0,2pi] range [rads]
*/
function WrapTo2pi(theta) {
    return (theta-Math.floor(0.5*theta/Math.PI)*2*Math.PI);
}


/* M2E(M,e): Converts from mean to eccentric anomaly by solving
       Kepler's equation with Newton's method
   Inputs :
      M:      mean anomaly [rad]
      e:      eccentricity [-]
   Output:
      Eccentric anomaly [rad]
*/
function M2E(M,e){

var DeltaE = 100;
var tol = 1000*Number.EPSILON;
var E  = M + e*Math.cos(M);   // initial guess
while (Math.abs(DeltaE)>tol){ // TODO: Gets stuck sometimes
    DeltaE = (-E+e*Math.sin(E)+M)/(1-e*Math.cos(E));
    E    = E + DeltaE;
}

return E;

}


/* QuarticRoot(P,Q): Iterative solver for Battin's quartic equation
       x^4-P*x^3+Q*x-1=0, for the root closest to x=1.
   Inputs :
      P:      Quartic's coefficient
      Q:      Quartic's coefficient
   Output:
      Quartic's root (the one closest to x=1).
*/
function QuarticRoot(P,Q) {
    var x = (4-2*P)/(4-3*P+Q);
    
    for (var i=1; i<3; i++){
        var pol     = -1 + x*( Q + x*x*( x - P) )
          , dpol    = Q + x*x*( -3*P + 4*x )
          , ddpol   = x*( -6*P + 12*x );
        x       = x - 2*pol*dpol/( 2*dpol*dpol - pol*ddpol);
    }
    return x;
    
}


// **************************************************************************

/* SingleImpulseDvOpt(r1,r2,v0): Solves the single-impulse time-free transfer.
   Inputs :
      r1:     initial position (Vector3D object)
      r2:     final position (Vector3D object)
      v0:     initial velocity (Vector3D object)
   Output:
      v1opt:  velocity at 1 for the transfer (Vector3D object)
      v2opt:  velocity at 2 for the transfer (Vector3D object)
      dvopt:  Delta-v vector for the transfer (Vector3D object)
*/
function SingleImpulseDvOpt(r1,r2,v0){

// Retrieve components of input vectors
var x1 = r1.x
  , y1 = r1.y
  , z1 = r1.z;

var x2 = r2.x
  , y2 = r2.y
  , z2 = r2.z;

var v0x = v0.x
  , v0y = v0.y
  , v0z = v0.z;


// Radial versors
var r1mag = Math.sqrt(x1*x1+y1*y1+z1*z1);
var ur1x = x1/r1mag
  , ur1y = y1/r1mag
  , ur1z = z1/r1mag;

var r2mag = Math.sqrt(x2*x2+y2*y2+z2*z2);
var ur2x = x2/r2mag
  , ur2y = y2/r2mag
  , ur2z = z2/r2mag;


// separating plane-change dv from v0
var ur1Xur2_x   = ur1y*ur2z-ur1z*ur2y
  , ur1Xur2_y   = ur1z*ur2x-ur1x*ur2z
  , ur1Xur2_z   = ur1x*ur2y-ur1y*ur2x;
var ur1Xur2_mag = Math.sqrt(ur1Xur2_x*ur1Xur2_x+ur1Xur2_y*ur1Xur2_y+ur1Xur2_z*ur1Xur2_z);

var uortx = ur1Xur2_x/ur1Xur2_mag
  , uorty = ur1Xur2_y/ur1Xur2_mag
  , uortz = ur1Xur2_z/ur1Xur2_mag;

// magnitude of plane-change DV
var DVout   = v0x*uortx+v0y*uorty+v0z*uortz;

var v0_pi_x = v0x-DVout*uortx
  , v0_pi_y = v0y-DVout*uorty
  , v0_pi_z = v0z-DVout*uortz;


// angular momentum of the transfer orbit
var h0x   = y1*v0_pi_z-z1*v0_pi_y
  , h0y   = z1*v0_pi_x-x1*v0_pi_z
  , h0z   = x1*v0_pi_y-y1*v0_pi_x;
var h0mag = Math.sqrt(h0x*h0x+h0y*h0y+h0z*h0z);

var uhx  = h0x/h0mag
  , uhy  = h0y/h0mag
  , uhz  = h0z/h0mag;


// chordal length and unit vector
var cx  = x2-x1
  , cy  = y2-y1
  , cz  = z2-z1;
var c   = Math.sqrt(cx*cx+cy*cy+cz*cz);
var ucx = cx/c
  , ucy = cy/c
  , ucz = cz/c;


// transfer arc angle
var Ctheta = ur1x*ur2x+ur1y*ur2y+ur1z*ur2z
  , Stheta = (ur1y*ur2z-ur1z*ur2y)*uhx+(ur1z*ur2x-ur1x*ur2z)*uhy+(ur1x*ur2y-ur1y*ur2x)*uhz;

// radial and chordal projections of v0
var v0_r1  = v0_pi_x*ur1x+v0_pi_y*ur1y+v0_pi_z*ur1z
  , v0_c   = v0_pi_x*ucx+ v0_pi_y*ucy+ v0_pi_z*ucz;

/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 * Solving Battin's quartic equation *
 * %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/
// cubic term (with changed sign) and linear term coefficients
var T = Math.sqrt( r2mag*r1mag/(mu*c)*(1+Ctheta) );
if (Stheta<0) { T = -T; }
var pp = T*v0_r1
  , qq = T*v0_c;
        
var xopt = QuarticRoot(pp, qq );

// optimum departure velocity
var vc1    = 1/(T*xopt)
  , vrho1  = xopt/T;

var v1optx = vc1*ucx + vrho1*ur1x
  , v1opty = vc1*ucy + vrho1*ur1y
  , v1optz = vc1*ucz + vrho1*ur1z;

var v1opt = new Vector3D(v1optx,v1opty,v1optz);

var v2optx = vc1*ucx - vrho1*ur2x
  , v2opty = vc1*ucy - vrho1*ur2y
  , v2optz = vc1*ucz - vrho1*ur2z;
  
var v2opt = new Vector3D(v2optx,v2opty,v2optz);

// Optimum single-impulse time-free deltaV
var dvopt = Math.sqrt( Math.pow(v0x-v1optx,2) + Math.pow(v0y-v1opty,2) + Math.pow(v0z-v1optz,2) );

return { v1opt: v1opt, v2opt: v2opt, dvopt: dvopt };

}


/* LambertAn(dt_in,r1,r2,v0,v1opt,v2opt,DVmax,refine): Approximate
       analytical solver for Lambert's problem, based on the works:
       - "Approximate Analytical Solution of the Lambert's Targeting Problem."
         Claudio Bombardelli, Juan Luis Gonzalo, Javier Roa. In Journal of 
         Guidance, Control and Dynamics (submitted). 2017.
       - "Approximate Analytical Solution of the Lambert's Targeting Problem."
         Claudio Bombardelli, Javier Roa, Juan Luis Gonzalo. Paper AAS 16-212 
         in 26th AAS/AIAA Space Flight Mechanics Meeting, Napa, CA, USA,
         14-18 February 2016.

   Inputs :
      dt_in:  time of flight [days]
      r1:     initial position (Vector3D object)
      r2:     final position (Vector3D object)
      v0:     initial velocity (Vector3D object)
      v1opt:  velocity at 1 for the single-impulse time-free transfer (Vector3D object)
      v2opt:  velocity at 2 for the single-impulse time-free transfer (Vector3D object)
      DVmax:  maximum value of Delta-v (for prunning)
      refine: currently unused
   Output:
      DVvec:  required Delta-v [km/s]
      R_B:    targeting error of Battin's Trajectory (uniform rectilinear motion approximation)
      R_2:    targeting error for final orbit
*/
function LambertAn( dt_in, r1, r2, v0, v1opt, v2opt, DVmax, refine ) {

// Time of flight
var dt   = dt_in*86400;

//Retrieve components of input vectors
var x1 = r1.x
  , y1 = r1.y
  , z1 = r1.z;
var r1mag = Math.sqrt(x1*x1+y1*y1+z1*z1);
var ur1x = x1/r1mag
  , ur1y = y1/r1mag
  , ur1z = z1/r1mag;

var x2 = r2.x
  , y2 = r2.y
  , z2 = r2.z;
var r2mag = Math.sqrt(x2*x2+y2*y2+z2*z2);
var ur2x = x2/r2mag
  , ur2y = y2/r2mag
  , ur2z = z2/r2mag;

var v1x = v1opt.x
  , v1y = v1opt.y
  , v1z = v1opt.z;
var v1mag_B = Math.sqrt(v1x*v1x+v1y*v1y+v1z*v1z);

var v2mag_B = v2opt.norm();

var v0x = v0.x
  , v0y = v0.y
  , v0z = v0.z;

var dv_Bx = v1x-v0x
  , dv_By = v1y-v0y
  , dv_Bz = v1z-v0z;



/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*
 * Characterization of the transfer trajectory (ORB0) *
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

// angular momentum
var hx  = y1*v1z-z1*v1y
  , hy  = z1*v1x-x1*v1z
  , hz  = x1*v1y-y1*v1x;

var h   = Math.sqrt(hx*hx+hy*hy+hz*hz);
var uhx = hx/h
  , uhy = hy/h
  , uhz = hz/h;


// transversal unit vector at r1
var uth1x = uhy*ur1z-uhz*ur1y
  , uth1y = uhz*ur1x-uhx*ur1z
  , uth1z = uhx*ur1y-uhy*ur1x;


// eccentricity vector
var ex   = (v1y*hz-v1z*hy)*inv_mu - ur1x
  , ey   = (v1z*hx-v1x*hz)*inv_mu - ur1y
  , ez   = (v1x*hy-v1y*hx)*inv_mu - ur1z;
var e    = Math.sqrt(ex*ex+ey*ey+ez*ez);
var uex  = ex/e
  , uey  = ey/e
  , uez  = ez/e;

// detect if orbit is elliptic
var is_ell = Boolean(e<1);

// true anomalies
var Ctheta1 = ur1x*uex + ur1y*uey + ur1z*uez
  , Ctheta2 = ur2x*uex + ur2y*uey + ur2z*uez;

// Cross product
var ueXur1_x = uey*ur1z-uez*ur1y
  , ueXur1_y = uez*ur1x-uex*ur1z
  , ueXur1_z = uex*ur1y-uey*ur1x;
var ueXur2_x = uey*ur2z-uez*ur2y
  , ueXur2_y = uez*ur2x-uex*ur2z
  , ueXur2_z = uex*ur2y-uey*ur2x;

// Trigonometric and angular operations
var Stheta1 = ueXur1_x*uhx + ueXur1_y*uhy + ueXur1_z*uhz
  , Stheta2 = ueXur2_x*uhx + ueXur2_y*uhy + ueXur2_z*uhz;

var inv_1plusecos1  = 1/(1+e*Ctheta1)
  , inv_1plusecos2  = 1/(1+e*Ctheta2);
var CE1             = (e+Ctheta1)*inv_1plusecos1
  , CE2             = (e+Ctheta2)*inv_1plusecos2;

var ee = e*e;
var sq_root = is_ell ? Math.sqrt(1-ee) : Math.sqrt(ee-1) ;
 
var SE1  = sq_root*Stheta1*inv_1plusecos1
  , SE2  = sq_root*Stheta2*inv_1plusecos2;

// Eccentric anomalies
if (is_ell){
    var E1 = Math.atan2(SE1,CE1)
      , E2 = Math.atan2(SE2,CE2);
}else{
    var E1 = Math.atanh(SE1/CE1)
      , E2 = Math.atanh(SE2/CE2);
}
var E2mE1 = WrapTo2pi(E2-E1);


// semi-major axis
var a  = r1mag/(1-e*CE1);


// mean motion (rad/s) and period (s)
var n_B  = Math.sqrt( (is_ell ? mu : -mu) / Math.pow(a,3) );
var T_B  = 2*Math.PI/n_B;


// transfer time (sec)
var dt_B  = Math.abs( E2mE1 - e*(SE2-SE1) )/n_B;

// total orbits travelled by Battin's trajectory during dt minus orbit fraction travelled by Battin's trajectory during dt_B
var delta_orb   = (dt - dt_B)/T_B;

// Computing optimum number of revoutions
var Nrev = Math.max( 0, Math.round(delta_orb) );
// NOTE: It should be Math.max( 0, Math.trunc(delta_orb) ). But trunc is included only in recent standards, and the result is the same in this case.
delta_orb = delta_orb - Nrev;

// time correction
var delta_t    = T_B*delta_orb;
var delta_t_B  = delta_t;


// Computing targeting error of Battin Trajectory (the uniform rectilinear motion approximation is employed)
// Initial targeting error
var R_B  = Math.abs(v2mag_B*delta_t_B);
var R_2  = R_B;


/*%%%%%%%%%%%%%%%%%%%%%%%%*
 *   D matrix Targeting   *
 *%%%%%%%%%%%%%%%%%%%%%%%%*/

// Computing D-matrix terms
var DE = E2mE1 + Nrev*2*Math.PI;

var DSE   = SE2-SE1
  , DCE   = CE2-CE1
  , S2E1  = 2*SE1*CE1
  , C2E1  = 2*CE1*CE1-1
  , S2E2  = 2*SE2*CE2
  , C2E2  = 2*CE2*CE2-1;

var DS2E  = S2E2-S2E1
  , DC2E  = C2E2-C2E1;


var K  = Math.pow(a,4)/(h*h*r1mag);

var Sth2mth1 = Stheta2*Ctheta1-Ctheta2*Stheta1
  , Cth2mth1 = Ctheta1*Ctheta2+Stheta1*Stheta2;

var d_rr  = r2mag*r2mag/h*Sth2mth1
  , d_rth = r2mag*r2mag/h*r1mag*(2-2*Cth2mth1-e*Stheta1*Sth2mth1)/( a*(1-ee) );


var d_tr  = K*(1-ee)/2*( (is_ell ? 1 : -1)*(6*e*DE - 4*(1+ee)*DSE + e*DS2E)*SE1 - (4*DCE-e*DC2E)*(CE1-e) )
  , d_tth = 0.25*K*sq_root*( 12*(1-ee)*DE + ee*(-3*DS2E+6*e*DSE) + ( 2*(2-ee)*SE1-e*S2E1 )*(4*DCE-e*DC2E) + (4*CE1-e*C2E1)*(e*DS2E-2*DSE*(2-ee)));


// inversion of the D-matrix and computation of velocity corrections
var det_D      = d_tr*d_rth-d_rr*d_tth;

var delta_vr   = delta_t/det_D; // Temporary storage
var delta_vth  = -d_rr*delta_vr;
delta_vr       = d_rth*delta_vr;


// Dealing with D matrix singularity
// A saturation limit is placed so that the greatest correction term cannot exceed sat_fact*v1mag_B
var sat_fact = 0.1;
var sat_val  = sat_fact*v1mag_B;
if ( delta_vr>sat_val ){
    delta_vth = delta_vth*sat_val/delta_vr;
    delta_vr  = sat_val;
}


/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 * computing final delta-V for Lamberts problem solution *
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

// Adding phasing correction for final Lambert's problem solution
var dv_Cx = delta_vr*ur1x + delta_vth*uth1x
  , dv_Cy = delta_vr*ur1y + delta_vth*uth1y
  , dv_Cz = delta_vr*ur1z + delta_vth*uth1z;

// computing time-constrained departure velocity
var v1Lx  = v1x + dv_Cx
  , v1Ly  = v1y + dv_Cy
  , v1Lz  = v1z + dv_Cz;

var DVvec = Math.sqrt( Math.pow(v1Lx-v0x,2) + Math.pow(v1Ly-v0y,2) + Math.pow(v1Lz-v0z,2) );
 
  
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//   REFINEMENT

if ( DVvec < DVmax ){ // Includes pruning with DVvec
    var v1x = v1Lx
      , v1y = v1Ly
      , v1z = v1Lz;
    var dv_Bx = v1x-v0x
      , dv_By = v1y-v0y
      , dv_Bz = v1z-v0z;
  
/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*
 * Characterization of the transfer trajectory (ORB1) *
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

// angular momentum
var hx  = y1*v1z-z1*v1y
  , hy  = z1*v1x-x1*v1z
  , hz  = x1*v1y-y1*v1x;

var h   = Math.sqrt(hx*hx+hy*hy+hz*hz);
var uhx = hx/h
  , uhy = hy/h
  , uhz = hz/h;


// transversal unit vector at r1
var uth1x = uhy*ur1z-uhz*ur1y
  , uth1y = uhz*ur1x-uhx*ur1z
  , uth1z = uhx*ur1y-uhy*ur1x;


// eccentricity vector
var ex   = (v1y*hz-v1z*hy)*inv_mu - ur1x
  , ey   = (v1z*hx-v1x*hz)*inv_mu - ur1y
  , ez   = (v1x*hy-v1y*hx)*inv_mu - ur1z;
var e    = Math.sqrt(ex*ex+ey*ey+ez*ez);
var uex  = ex/e
  , uey  = ey/e
  , uez  = ez/e;

// detect if orbit is elliptic
var is_ell = Boolean(e<1);

// true anomalies
var Ctheta1 = ur1x*uex + ur1y*uey + ur1z*uez
  , Ctheta2 = ur2x*uex + ur2y*uey + ur2z*uez;

// Cross product
var ueXur1_x = uey*ur1z-uez*ur1y
  , ueXur1_y = uez*ur1x-uex*ur1z
  , ueXur1_z = uex*ur1y-uey*ur1x;
var ueXur2_x = uey*ur2z-uez*ur2y
  , ueXur2_y = uez*ur2x-uex*ur2z
  , ueXur2_z = uex*ur2y-uey*ur2x;

  // Trigonometric and angular operations
var Stheta1 = ueXur1_x*uhx + ueXur1_y*uhy + ueXur1_z*uhz
  , Stheta2 = ueXur2_x*uhx + ueXur2_y*uhy + ueXur2_z*uhz;

var inv_1plusecos1  = 1/(1+e*Ctheta1)
  , inv_1plusecos2  = 1/(1+e*Ctheta2);
var CE1             = (e+Ctheta1)*inv_1plusecos1
  , CE2             = (e+Ctheta2)*inv_1plusecos2;

var ee = e*e;
var sq_root = is_ell ? Math.sqrt(1-ee) : Math.sqrt(ee-1) ;
 
var SE1  = sq_root*Stheta1*inv_1plusecos1
  , SE2  = sq_root*Stheta2*inv_1plusecos2;

// Eccentric anomalies
if (is_ell){
    var E1 = Math.atan2(SE1,CE1)
      , E2 = Math.atan2(SE2,CE2);
}else{
    var E1 = Math.atanh(SE1/CE1)
      , E2 = Math.atanh(SE2/CE2);
}
var E2mE1 = WrapTo2pi(E2-E1);


// semi-major axis
var a  = r1mag/(1-e*CE1);

var r2mag_orb1 = a*(1-e*CE2);


// mean motion (rad/s) and period (s)
var n_B  = Math.sqrt( (is_ell ? mu : -mu) / Math.pow(a,3) );
var T_B  = 2*Math.PI/n_B;


// transfer time (sec)
var dt_B  = Nrev*T_B + Math.abs( E2mE1 - e*(SE2-SE1) )/n_B;

// Radius correction
var delta_r = r2mag_orb1 - r2mag;

// total orbits travelled by Battin's trajectory during dt minus orbit fraction travelled by Battin's trajectory during dt_B
var delta_orb   = (dt - dt_B)/T_B;

// Computing optimum number of revoutions
//var Nrev = Math.max( 0, Math.floor(delta_orb) ); NOTE: Deleted
//delta_orb = delta_orb - Nrev; NOTE: Deleted

// time correction
var delta_t    = T_B*delta_orb;


// Computing targeting error of Battin Trajectory (the uniform rectilinear motion approximation is employed)
// Initial targeting error
var R_B  = Math.abs(v2mag_B*delta_t_B);
var R_2  = R_B;


/*%%%%%%%%%%%%%%%%%%%%%%%%*
 *   D matrix Targeting   *
 *%%%%%%%%%%%%%%%%%%%%%%%%*/

// Computing D-matrix terms
var DE = E2mE1 + Nrev*2*Math.PI;

var DSE   = SE2-SE1
  , DCE   = CE2-CE1
  , S2E1  = 2*SE1*CE1
  , C2E1  = 2*CE1*CE1-1
  , S2E2  = 2*SE2*CE2
  , C2E2  = 2*CE2*CE2-1;

var DS2E  = S2E2-S2E1
  , DC2E  = C2E2-C2E1;


var K  = Math.pow(a,4)/(h*h*r1mag);

var Sth2mth1 = Stheta2*Ctheta1-Ctheta2*Stheta1
  , Cth2mth1 = Ctheta1*Ctheta2+Stheta1*Stheta2;

var d_rr  = r2mag_orb1*r2mag_orb1/h*Sth2mth1
  , d_rth = r2mag_orb1*r2mag_orb1/h*r1mag*(2-2*Cth2mth1-e*Stheta1*Sth2mth1)/( a*(1-ee) );


var d_tr  = K*(1-ee)/2*( (is_ell ? 1 : -1)*(6*e*DE - 4*(1+ee)*DSE + e*DS2E)*SE1 - (4*DCE-e*DC2E)*(CE1-e) )
  , d_tth = 0.25*K*sq_root*( 12*(1-ee)*DE + ee*(-3*DS2E+6*e*DSE) + ( 2*(2-ee)*SE1-e*S2E1 )*(4*DCE-e*DC2E) + (4*CE1-e*C2E1)*(e*DS2E-2*DSE*(2-ee)));


// inversion of the D-matrix and computation of velocity corrections
var det_D      = d_tr*d_rth-d_rr*d_tth;

var delta_vr   = ( d_rth*delta_t - d_tth*delta_r)/det_D;
var delta_vth  = ( -d_rr*delta_t + d_tr*delta_r )/det_D;



/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 * computing final delta-V for Lamberts problem solution *
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

// Adding phasing correction for final Lambert's problem solution
var dv_Cx = delta_vr*ur1x + delta_vth*uth1x
  , dv_Cy = delta_vr*ur1y + delta_vth*uth1y
  , dv_Cz = delta_vr*ur1z + delta_vth*uth1z;

// computing time-constrained departure velocity
var v1Lx  = v1x + dv_Cx
  , v1Ly  = v1y + dv_Cy
  , v1Lz  = v1z + dv_Cz;


v1x = v1Lx;
v1y = v1Ly;
v1z = v1Lz;
  
  
// Characterization of the last trajectory (O2) in order to establish targeting error and prune out ill-converged solutions
  
// angular momentum
var hx  = y1*v1z-z1*v1y
  , hy  = z1*v1x-x1*v1z
  , hz  = x1*v1y-y1*v1x;

var h   = Math.sqrt(hx*hx+hy*hy+hz*hz);
var uhx = hx/h
  , uhy = hy/h
  , uhz = hz/h;
  
  
  // eccentricity vector
var ex   = (v1y*hz-v1z*hy)*inv_mu - ur1x
  , ey   = (v1z*hx-v1x*hz)*inv_mu - ur1y
  , ez   = (v1x*hy-v1y*hx)*inv_mu - ur1z;
var e    = Math.sqrt(ex*ex+ey*ey+ez*ez);
var uex  = ex/e
  , uey  = ey/e
  , uez  = ez/e;

// detect if orbit is elliptic
var is_ell = Boolean(e<1);

// true anomalies
var Ctheta1 = ur1x*uex + ur1y*uey + ur1z*uez
  , Ctheta2 = ur2x*uex + ur2y*uey + ur2z*uez;

// Cross product
var ueXur1_x = uey*ur1z-uez*ur1y
  , ueXur1_y = uez*ur1x-uex*ur1z
  , ueXur1_z = uex*ur1y-uey*ur1x;
var ueXur2_x = uey*ur2z-uez*ur2y
  , ueXur2_y = uez*ur2x-uex*ur2z
  , ueXur2_z = uex*ur2y-uey*ur2x;

var Stheta1 = ueXur1_x*uhx + ueXur1_y*uhy + ueXur1_z*uhz
  , Stheta2 = ueXur2_x*uhx + ueXur2_y*uhy + ueXur2_z*uhz;

var inv_1plusecos1  = 1/(1+e*Ctheta1)
  , inv_1plusecos2  = 1/(1+e*Ctheta2);
var CE1             = (e+Ctheta1)*inv_1plusecos1
  , CE2             = (e+Ctheta2)*inv_1plusecos2;

var ee = e*e;
var sq_root = is_ell ? Math.sqrt(1-ee) : Math.sqrt(ee-1) ;
 
var SE1  = sq_root*Stheta1*inv_1plusecos1
  , SE2  = sq_root*Stheta2*inv_1plusecos2;


if (is_ell){
    var E1 = Math.atan2(SE1,CE1)
      , E2 = Math.atan2(SE2,CE2);
}else{
    var E1 = Math.atanh(SE1/CE1)
      , E2 = Math.atanh(SE2/CE2);
}
var E2mE1 = WrapTo2pi(E2-E1);


// semi-major axis
var a  = r1mag/(1-e*CE1);

r2mag_orb1 = a*(1-e*CE2);


// mean motion (rad/s) and period (s)
var n_B  = Math.sqrt( (is_ell ? mu : -mu) / Math.pow(a,3) );
var T_B  = 2*Math.PI/n_B;

// transfer time (sec)
var dt_B  = Nrev*T_B + Math.abs( E2mE1 - e*(SE2-SE1) )/n_B; 

// Radius correction
var delta_r = r2mag_orb1 - r2mag;


// total orbits travelled by Battin's trajectory during dt minus orbit fraction travelled by Battin's trajectory during dt_B
var delta_orb   = (dt - dt_B)/T_B;

var delta_t = delta_orb*T_B;


// Computing targeting error of ORB1 trajectory (the uniform rectilinear motion approximation is employed)

// Lagrangian coefficients
var p = a*(1-ee);
var sig1 = (x1*v1x+y1*v1y+z1*v1z)/sqrt_mu;

var F_t = sqrt_mu/(r1mag*p)*(sig1*(1-Cth2mth1)-Math.sqrt(p)*Sth2mth1);
var G_t = 1-r1mag/p*(1-Cth2mth1);

var v2x = F_t*x1 + G_t*v1x;
var v2y = F_t*y1 + G_t*v1y;
var v2z = F_t*z1 + G_t*v1z;

var v2mag = Math.sqrt( Math.pow(v2x,2) + Math.pow(v2y,2) + Math.pow(v2z,2) );

// flight direction angle
var gamma = e*Stheta2/Math.sqrt( e*(e+2*Ctheta2)+1);



var R_2  = Math.sqrt( Math.pow(delta_r,2) + Math.pow(v2mag*delta_t,2) + 2*delta_r*v2mag*delta_t*gamma );


// Pruning out ill-converged results
var DVdep = Math.sqrt( Math.pow(v1Lx-v0x,2) + Math.pow(v1Ly-v0y,2) + Math.pow(v1Lz-v0z,2) );

DVvec = R_B<1.5*R_2 ? 10*DVmax : DVdep;

  
  
  }else{
      // Case when the refinement is not performed because the DV after the first targeting goes above DVmax
      DVvec = 10*DVmax;
      
  }
  
return [ DVvec, R_B, R_2 ];

}


/* GlobalDVminEstimator(oe0,oe2,tdep_min,arrival_opt): Computes a fast
       estimation of the global minimum Delta-v, for a time range
       defined by a minimum departure date and the synodic period.
   Inputs :
      oe0:          departure orbital elements (OrbitalElements object)
      oe2:          arrival orbital elements (OrbitalElements object)
      tdep_min:     minimum departure date (dateObj object)
      arrival_opt:  boolean for choosing between arrival (true) or 
                    departure (false) Delta-v optimization
   Output:
      Estimate for the minimum Delta-v [km/s] (scalar)
*/
function GlobalDVminEstimator(oe0, oe2, tdep_min, arrival_opt ){

/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*
 * rough and fast computation of an approximate global minimum DV *
 * (using single-impulse optimum transfer DV)                     *
 * over a reasonably wide grid domain                             *
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

// synodic period (days)
var om0 = Math.sqrt( mu/Math.pow(oe0.a,3) );
var om2 = Math.sqrt( mu/Math.pow(oe2.a,3) );
if (om0!=om2) {
    var T_syn    = 2*Math.PI/Math.abs(om0-om2)/86400;
}else{
    var T_syn = 5.0*365.25;
}

// Circle-to-circle Hohmann transfer duration (days)
var T_h    = 2*Math.PI/Math.sqrt(8*mu/Math.pow(oe0.a+oe2.a, 3))/86400;    
var dt_min = T_h/2;
  
  
  // converting launch date into MJD
  tdep_min = tdep_min.MJD();


        // departure array
        var t0 = new Array(50);
        for (var k=0; k<50; k++) t0[k] = tdep_min + k*T_syn/49; // Equispaced values between tdep_min and tdep_min+T_syn

        // time of flight array
        var tof = new Array(50);
        for (var k=0; k<50; k++) tof[k]  = dt_min + k*T_h*1.5/49; // Equispaced values between T_h/2 and 2*T_h

        var DVmin = 1e10;
        for (var k=0; k<50; k++){ // Loop in launch time
                var rvlaunch = oe0.rv(t0[k]);
        	// Loop in time of flight
        	for (var l=0; l<50; l++){
                        var rvarrival = oe2.rv(t0[k]+tof[l]);
        		if (arrival_opt){
        			var r0 = rvarrival.r;
        			var r2 = rvlaunch.r;
        			var v0 = rvarrival.v;
                                v0.opposite();
        		}else{
        			var r0 = rvlaunch.r;
        			var r2 = rvarrival.r;
        			var v0 = rvlaunch.v;
        		}
        		var singleimp = SingleImpulseDvOpt(r0,r2,v0);
        		if (singleimp.dvopt<DVmin) DVmin = singleimp.dvopt;
        	}
        }
  
  return DVmin;
  
}


/* PorkChopAn(oe0,oe2,transfer_type,tdep_min,tdep_max,dt_min,dt_max,dvmax,ndim, mdim):
       Computes the pork-chop plot for given departure and arrival orbital
       elements, a range of departure times [tdep_min,tdep_max], and a range of
       times of flights [dt_min,dt_max], using the approximate analytical solution
       implemented in function LambertAn.
   Inputs :
      oe0:            departure orbital elements (OrbitalElements object)
      oe2:            arrival orbital elements (OrbitalElements object)
      transfer_type:  0 - Arrival Delta-v optimization
                      1 - Departure Delta-v optimization
                      2 - Both
      tdep_min:       minimum departure date (dateObj object)
      tdep_max:       maximum departure date (dateObj object)
      dt_min:         minimum time of flight [days]
      dt_max:         maximum time of flight [days]
      dvmax:          maximum Delta-v [km/s] (for prunning). For transfer_type=2,
                      it must be an array containing the DV limits for arrival
                      and departure optimizations (in that order)
      ndim:           grid dimension in departure date
      mdim:           grid dimension in time of flight
   Output:
      The output is an object with the following fields:
        t0:              1D array of length ndim*mdim with the departure times in MJD [days]
        tof:             1D array of length ndim*mdim with the times of flight [days]
        If transfer_type is 0 or 1:
        dvmat:           1D array of length ndim*mdim with the Delta-v [km/s]
        If transfer_type is 2:
        dvmat_arrival:   1D array of length ndim*mdim with the Delta-v [km/s]
                         for the arrival optimization
        dvmat_departure: 1D array of length ndim*mdim with the Delta-v [km/s]
                         for the departure optimization
*/
function PorkChopAn(oe0, oe2, transfer_type, tdep_min, tdep_max, dt_min, dt_max, dvmax, ndim, mdim){
    
    // Auxiliar function for a single case
    function PorkChopAn_Single(rlaunch,rarrival,vlaunch,varrival,tof,arrival_opt,dvmax){
        // Set position and velocity vectors
        if (arrival_opt){
                var r0 = rarrival
                  , r2 = rlaunch
                  , v0 = varrival;
                v0.opposite();
        }else{
                var r0 = rlaunch
                  , r2 = rarrival
                  , v0 = vlaunch;
        }
        // Single impulse case calculation
        var singleimp = SingleImpulseDvOpt(r0,r2,v0);
        // If single impulse DV is within the pruning limit, perform the retargeting
        if (singleimp.dvopt<dvmax){
                var lamban = LambertAn( tof, r0, r2, v0, singleimp.v1opt, singleimp.v2opt, dvmax, false );
                var DV = lamban[0];
        }else{
                var DV = 10*dvmax;
        }
        return DV;
    }

    
    
    // converting launch window date into MJD
    var tdep_min_MJD = tdep_min.MJD()
      , tdep_max_MJD = tdep_max.MJD();

    // Grid steps in launch date and time of flight
    var dX       = (tdep_max_MJD-tdep_min_MJD)/(ndim-1)
      , dY       = (dt_max-dt_min)/(mdim-1);


    // departure date array
    var t0 = new Array(ndim);
    for (var k=0; k<ndim; k++) t0[k] = tdep_min_MJD + k*dX;  

    // time of flight array
    var tof = new Array(mdim);
    for (var k=0; k<mdim; k++) tof[k]  = dt_min + k*dY;
    
    // JS doesn't have native support for multidimensional arrays (you could use arrays of arrays).
    // To avoid the computational cost penalty for the latter, results are stored linearly in a normal numeric array, with same departure time cases grouped together
    
    
    // Initialize the output object
    var PCPObject = { t0: t0, tof: tof }
    // Initialize some auxiliar variables
    var rvlaunch, rvarrival, blockind, k, l;
    // Loops are coded inside the 'if' to reduce computational cost
    if (transfer_type==2) {
        PCPObject.dvmat_arrival   = new Array(ndim*mdim);
        PCPObject.dvmat_departure = new Array(ndim*mdim);
        for (k=0; k<ndim; k++){// Loop in launch time
            rvlaunch = oe0.rv(t0[k]); blockind = k*mdim;
            for (l=0; l<mdim; l++){// Loop in time of flight
                rvarrival = oe2.rv(t0[k]+tof[l]);
                PCPObject.dvmat_arrival[blockind+l]   = PorkChopAn_Single(rvlaunch.r,rvarrival.r,rvlaunch.v,rvarrival.v,tof[l],true,dvmax[0]);
                PCPObject.dvmat_departure[blockind+l] = PorkChopAn_Single(rvlaunch.r,rvarrival.r,rvlaunch.v,rvarrival.v,tof[l],false,dvmax[1]);
            }
        }
    } else if ( (transfer_type==0)|(transfer_type==1) ) {
        PCPObject.dvmat = new Array(ndim*mdim);
        var arrival_opt = transfer_type==0 ? true : false;
        for (k=0; k<ndim; k++){// Loop in launch time
            rvlaunch = oe0.rv(t0[k]); blockind = k*mdim;
            for (l=0; l<mdim; l++){// Loop in time of flight
                rvarrival = oe2.rv(t0[k]+tof[l]);
                PCPObject.dvmat[blockind+l] = PorkChopAn_Single(rvlaunch.r,rvarrival.r,rvlaunch.v,rvarrival.v,tof[l],arrival_opt,dvmax);
            }
        }
    }
    
    return PCPObject;

}
