
AstroTimeline – The Astronomer's Timeline
=======

AstroTimeline is a BSD-licensed Javascript class for plotting a timeline on a web page showing key times througout the night along with a pointer for the current time. The color of the timeline qualitatively indicates sky darkness. It is intended to be used by astronomers who need to know when the sky will be truly dark, when the moon sets or rises, etc., to plan their observing or photography activities. It was created by Russell Croman, and leverages the SunCalc library by Vladimir Agafonkin for performing the astronomical computations. See the LICENSE.txt and LICENSE-suncalc.txt files for information on the BSD licensing terms.

AstroTimeline can be configured for a particular location and time zone, and will display properly no matter the time zone of the browser accessing the web page. Thus it is useful for local astronomy activites as well as remotely-controlled operations.

## Timeline Display
![Example timeline](https://github.com/rcroman/AstroTimeline/blob/master/example_timeline.png?raw=true)

The timeline spans from an hour before sunset on the left to an hour after sunrise on the right. Sunrise and sunset times are indicated by orange markers, with the times displayed above. Similarly, astronomical twilight times are indicated by blue markers with their respective times. Civil and nautical twilight times are indicated by smaller markers after sunset and before sunrise. If the moon rises or sets during the period covered by the timeline, gray markers will appear at appropriate locations, along with the relevant times displayed above the markers.

The color of the timeline indicates sky brightness in a qualitative sense. When the moon rises, for instance, the timeline color will change from dark blue to gray. No attempt has been made to make the timeline color quantitatively accurate, so the color will be the same shade of gray when the moon is up regardless of the moon's current illumination.

## Browser Compatibility
AstroTimeline should be compatible with any browser that 1) supports JavaScript, and 2) supports the HTML `<canvas>` element. As of this writing, this includes at least Edge, Safari, Chrome, and Firefox.

## Installation
Place the downloaded files wherever you like on your web server. Be sure to choose a location that will be accessible via the html page that will contain the timeline. You can test the functionality of your installation by pointing a browser at the test.html page.

On the html page where you wish the timeline to appear, place the following lines in the `<head>` section, replacing `<path>` with whatever is appropriate to where you placed the astrotimeline files on your web server:

```
<script language="javascript" src="<path>suncalc.js"></script>
<script language="javascript" src="<path>astrotimeline.js"></script>
```
In the `<body>` section of the page, place a `<div>` element where you want the timeline to appear. It is recommended to place this `<div>` element inside another element that specifies how wide you want the timeline to appear. Give the `<div>` element a unique ID. For example:

```
<table width="800">
    <tr><td><div id="astrotimeline"></div></td></tr>
</table>
```
Finally, in the `<body>` tag itself, add `onLoad` code to actually create the timeline object and start real-time updates of the current-time pointer. This is also where you can specify the observing location and time zone. For example:

```
<body onLoad="var tl = new AstroTimeline(lat, lon, alt, timeZone, locale, rolloverHour, divID);">
```
Parameters:

- `lat`: Latitude of observing location in decimal degrees, e.g., 32.90
- `lon`: Longitude of observing location in decimal degrees, e.g., -105.53 (use negative numbers for locations in the western hemisphere)
- `alt`: Altitude of observing location, in meters above mean sea level
- `timeZone`: Time zone of observing location, e.g., `'US/Mountain'`. Supported time zone strings are depending on the implementation of JavaScript running on whatever browser views the page, but generally conform to the IANA time zone database. Be sure to use a time zone string that will take into account daylight savings time, if applicable to your location. Other examples include `'US/Central'`, `'US/Pacific'`, etc. Default is `'US/Mountain'`. No checking of the consistency of the `timeZone` and `lat`/`lon` parameters is performed.
- `locale`: The locale code used for rendering time information. Examples include `'en-US'` for 12-hour time (AM/PM), and `'en-GB'` for 24-hour time. AstroTimeline has only been tested with `'en-US'` and `'en-GB'`. Please report any bugs with using other locales. Default is `'en-US'`.
- `rolloverHour`: Upon reloading the page in the browser after this hour of the day, the timeline will be re-drawn for the following night. Defaults to 8am.
- `divID`: The ID of the `<div>` element where you want the timeline drawn. Defaults to `'astrotimeline'`.

## Notes on Times
Sunset and sunrise times are calculated using the latitude, longitude, altitude, and time zone specified when creating the AstroTimeline object. Twilight times are calculated using sea-level altitude since that is primarily what matters with respect to sky darkness. Moon rise and set times currently ignore the altitude parameter, primarily because the SunCalc library currently does the same. 

## Change Log

#### 0.0.0 &mdash; 18 July 2020

- First release.
