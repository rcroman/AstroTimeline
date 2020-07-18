/*
(c) 2020, Russell Croman
AstroTimeline is a JavaScript library for displaying a graphical widget on a web page
showing key times througout the night with a pointer indicating current time.
*/

class AstroTimeline {
	constructor(	lat = 32.90,
					lon = -105.53,
					alt = 2222,
					timeZone = 'US/Mountain',
					locale = 'en-US',
					rolloverHour = 8,
					divID = 'astrotimeline',
					dateTime = new Date() )
	{
		this.lat = lat;
		this.lon = lon;
		this.alt = alt;
		this.timeZone = timeZone;
		this.locale = locale;
		this.rolloverHour = rolloverHour;
		this.divID = divID;
		
		// default to now if no time specified
		this.dateTime = new Date(dateTime);
		this.createWidget();
		this.start();
	}
	
	// Test functions
	newTime() {
		
	}
	
	newDate() {
		
	}
	
	newLocation() {
		
	}
	
	yyyymmdd (d = new Date()) {
		var s = d.toLocaleDateString('en-GB', {timeZone: this.timeZone}).split('/');
		return Number(s[2].concat(s[1]).concat(s[0]));
	}
	
	correctSunDate (d = new Date()) {
		var localD = new Date(d);
		var st = SunCalc.getTimes(localD, this.lat, this.lon, this.alt);
		var err = Math.sign(this.yyyymmdd(st['sunset']) - this.yyyymmdd(localD));
		return (err == 0) ? localD : localD.setDate(localD.getDate() - err);
	}
	
	getCorrectMoonTimes (today = new Date()) {
		var yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
		var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
		
		var mt = SunCalc.getMoonTimes(today, this.lat, this.lon);
		if ((this.yyyymmdd(mt['rise']) - this.yyyymmdd(today)) == 0)
			return mt;
			
		if ((this.yyyymmdd(mt['set']) - this.yyyymmdd(today)) == 0)
			return mt;
		
		mt = SunCalc.getMoonTimes(yesterday, this.lat, this.lon);
		
		if ((this.yyyymmdd(mt['rise']) - this.yyyymmdd(today)) == 0)
			return mt;
			
		if ((this.yyyymmdd(mt['set']) - this.yyyymmdd(today)) == 0)
			return mt;
		
		mt = SunCalc.getMoonTimes(tomorrow, this.lat, this.lon);
		
		if ((this.yyyymmdd(mt['rise']) - this.yyyymmdd(today)) == 0)
			return mt;
			
		if ((this.yyyymmdd(mt['set']) - this.yyyymmdd(today)) == 0)
			return mt;
		
		return false;
	}

	createWidget() {
		// TODO: check for no element by this ID
		this.div = document.getElementById(this.divID);
		this.timelineWidth = this.div.offsetWidth;
		this.div.style.position = 'relative';
		
		// create canvas and pointer elements
		this.canvasID = 'astrotimeline_canvas';
		this.pointerID = this.divID + '_pointer';
		this.div.innerHTML = '';
		this.div.innerHTML = '<canvas id="' + this.canvasID + '" width=' + this.timelineWidth 
			+ 'px" height="100px" style="z-index: 0;">This browser does not support the "canvas" tag.</canvas>' 
			+ '<p id="' + this.pointerID + '" style="position:absolute; bottom:11px; left:0px; z-index: 1; ' 
			+ 'font-size: 12px; font-family: Arial;">↑</p>';
		
		this.canvas = document.getElementById(this.canvasID);
		this.pointer = document.getElementById(this.pointerID);
		this.arrowHalfWidth = this.pointer.offsetWidth/2;
		this.pointer.style.minWidth = '60px';
		
		// Discover offset between browser's time zone and the target time zone
		this.tzOffsetBrowser = this.dateTime.toLocaleDateString('en-GB', {timeZoneName: 'short'}).split('GMT')[1];
		this.tzOffsetTarget = this.dateTime.toLocaleDateString('en-GB', {timeZone: this.timeZone, timeZoneName: 'short'}).split('GMT')[1];
		this.tzOffset = this.tzOffsetTarget - this.tzOffsetBrowser;
		
		this.day1 = new Date(this.dateTime);
		this.day2 = new Date(this.dateTime);
		
		// If it's after the rollover time, analyze today and tomorrow, otherwise analyze yesterday and today
		// TODO: maybe make this an hour (or configurable) after sunrise
		this.h = this.day1.toLocaleTimeString("en-GB", {timeZone: this.timeZone, hour: "numeric"});
		
		if (this.h >= this.rolloverHour) {
			this.day2.setDate(this.day2.getDate() + 1);
		} else {
			this.day1.setDate(this.day1.getDate() - 1);
		}

		// TODO: use an altitude of 0 to compute astronomical twilight
		// Correct day1 and day2 so that SunCalc gives times from the right date
		var day1c = this.correctSunDate(this.day1);
		var day2c = this.correctSunDate(this.day2);
		
		var sunTimes1 = SunCalc.getTimes(day1c, this.lat, this.lon, this.alt),
			sunTimes2 = SunCalc.getTimes(day2c, this.lat, this.lon, this.alt),
			sunTimes1_0 = SunCalc.getTimes(day1c, this.lat, this.lon, 0),
			sunTimes2_0 = SunCalc.getTimes(day2c, this.lat, this.lon, 0),
			moonTimes1 = this.getCorrectMoonTimes(this.day1),
			moonTimes2 = this.getCorrectMoonTimes(this.day2);
		this.sunset = sunTimes1.sunset;
		this.darkCivil = sunTimes1_0.dusk;
		this.darkNaut = sunTimes1_0.nauticalDusk;
		this.darkAstro = sunTimes1_0.night;
		this.dawnAstro = sunTimes2_0.nightEnd;
		this.dawnNaut = sunTimes2_0.nauticalDawn;
		this.dawnCivil = sunTimes2_0.dawn;
		this.sunrise = sunTimes2.sunrise;
		var	moonrise1 = moonTimes1.rise,
			moonset1 = moonTimes1.set,
			moonrise2 = moonTimes2.rise,
			moonset2 = moonTimes2.set;

		// Compute beginning and ending times of timeline
		this.timeBegin = new Date(this.sunset);
		this.timeEnd = new Date(this.sunrise);
		
		this.timeBegin.setHours(this.timeBegin.getHours() - 1);
		this.timeEnd.setHours(this.timeEnd.getHours() + 1);

		// Scaling factor to convert from time to position on timeline
		this.timeToPx = this.timelineWidth/(this.timeEnd.getTime() - this.timeBegin.getTime());

		// Moon times require special handling to figure out which ones matter for the time period of interest...
		// TODO: handle alwaysup and alwaysdown conditions
		// TODO: fix suncalc code to correct moonrise/set times for altitude
		this.moonrise = false;
		if ((moonrise1 >= this.timeBegin) && (moonrise1 <= this.timeEnd))
			this.moonrise = moonrise1;
		else if ((moonrise2 >= this.timeBegin) && (moonrise2 <= this.timeEnd))
			this.moonrise = moonrise2;

		this.moonset = false;
		if ((moonset1 >= this.timeBegin) && (moonset1 <= this.timeEnd))
			this.moonset = moonset1;
		else if ((moonset2 >= this.timeBegin) && (moonset2 <= this.timeEnd))
			this.moonset = moonset2;

		// Strings to print times along timeline
		var sunsetTimeStr = this.sunset.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
		var darkTimeStr = this.darkAstro.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
		var dawnTimeStr = this.dawnAstro.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
		var sunriseTimeStr =this.sunrise.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});

		var sunsetPx = (this.sunset.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var darkCivilPx = (this.darkCivil.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var darkNautPx = (this.darkNaut.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var darkAstroPx = (this.darkAstro.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var dawnAstroPx = (this.dawnAstro.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var dawnNautPx = (this.dawnNaut.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var dawnCivilPx = (this.dawnCivil.getTime() - this.timeBegin.getTime())*this.timeToPx;
		var sunrisePx = (this.sunrise.getTime() - this.timeBegin.getTime())*this.timeToPx;

		var moonriseTimeStr = '';
		var moonrisePx = false;
		if (this.moonrise) {
			moonriseTimeStr = this.moonrise.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
			moonrisePx = (this.moonrise.getTime() - this.timeBegin.getTime())*this.timeToPx;
		}

		var moonsetTimeStr = '';
		var moonsetPx = false;
		if (this.moonset) {
			moonsetTimeStr = this.moonset.toLocaleString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
			moonsetPx = (this.moonset.getTime() - this.timeBegin.getTime())*this.timeToPx;
		}

		var ctx = this.canvas.getContext('2d');
		ctx.lineWidth = 4;
		const yOffset = 50;
		const moonOffset = 0.05;

		// Compute key points for color gradient creation
		var gStart = 0;
		var gSunset = sunsetPx/this.timelineWidth;
		var gSunsetTwilight = (2*sunsetPx + darkAstroPx)/(3*this.timelineWidth);
		var gDark = darkAstroPx/this.timelineWidth;
		var gDawn = dawnAstroPx/this.timelineWidth;
		var gSunriseTwilight = (2*sunrisePx + dawnAstroPx)/(3*this.timelineWidth);
		var gSunrise = sunrisePx/this.timelineWidth;
		var gStop = 1;

		var gMoonrise = this.moonrise ? (moonrisePx/this.timelineWidth) : false;
		var gMoonset = this.moonset ? (moonsetPx/this.timelineWidth) : false;

		// Create color gradient to indicate sky brightness along timeline
		// TODO: fully handle conditions of moon rise/set before/after key sun-based times
		var grad = ctx.createLinearGradient(0, 0, this.timelineWidth, 0);
		grad.addColorStop(gStart, "yellow");
		grad.addColorStop(gSunset, "orange");
		grad.addColorStop(gSunsetTwilight, "blue");

		if ((gMoonrise && (gMoonrise < gDark)) || (gMoonset && (gMoonset > gDark)))
			grad.addColorStop(gDark, "gray");			
		else
			grad.addColorStop(gDark, "darkblue");

		if ((gMoonrise && (gMoonrise > gDark) && (gMoonrise < gDawn))) {
			grad.addColorStop(gMoonrise - moonOffset, "darkblue");
			grad.addColorStop(gMoonrise, "gray");
		}

		if ((gMoonset && (gMoonset > gDark) && (gMoonset < gDawn))) {
			grad.addColorStop(gMoonset, "gray");
			grad.addColorStop(gMoonset + moonOffset, "darkblue");
		}

		if ((gMoonrise && (gMoonrise < gDawn)) || (gMoonset && (gMoonset > gDawn)))
			grad.addColorStop(gDawn, "gray");
		else
			grad.addColorStop(gDawn, "darkblue");

		grad.addColorStop(gSunriseTwilight, "blue");
		grad.addColorStop(gSunrise, "orange");
		grad.addColorStop(gStop, "yellow");
		ctx.strokeStyle = grad;

		// draw start to sunset
		ctx.beginPath();
		ctx.moveTo(0, yOffset);
		ctx.lineTo(sunsetPx, yOffset);
		ctx.stroke();

		// draw sunset to dark
		ctx.beginPath();
		ctx.moveTo(sunsetPx, yOffset);
		ctx.lineTo(darkAstroPx, yOffset);
		ctx.stroke();

		// draw dark to dawn
		ctx.beginPath();
		ctx.moveTo(darkAstroPx, yOffset);
		ctx.lineTo(dawnAstroPx, yOffset);
		ctx.stroke();

		// draw dawn to sunrise
		ctx.beginPath();
		ctx.moveTo(dawnAstroPx, yOffset);
		ctx.lineTo(sunrisePx, yOffset);
		ctx.stroke();

		// draw sunrise to end
		ctx.beginPath();
		ctx.moveTo(sunrisePx, yOffset);
		ctx.lineTo(this.timelineWidth, yOffset);
		ctx.stroke();

		// draw markers for key times
		ctx.beginPath();
		ctx.moveTo(darkCivilPx, yOffset - 4);
		ctx.lineTo(darkCivilPx, yOffset + 4);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(darkNautPx, yOffset - 4);
		ctx.lineTo(darkNautPx, yOffset + 4);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(dawnNautPx, yOffset - 4);
		ctx.lineTo(dawnNautPx, yOffset + 4);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(dawnCivilPx, yOffset - 4);
		ctx.lineTo(dawnCivilPx, yOffset + 4);
		ctx.stroke();
		
		
		ctx.fillStyle = "orange";
		ctx.fillRect(sunsetPx-4, yOffset-4, 8, 8);
		ctx.fillRect(sunrisePx-4, yOffset-4, 8, 8);

		ctx.fillStyle = "blue";
		ctx.fillRect(darkAstroPx-4, yOffset-4, 8, 8);
		ctx.fillRect(dawnAstroPx-4, yOffset-4, 8, 8);

		ctx.fillStyle = "lightgray";
		if (this.moonrise) ctx.fillRect(moonrisePx-4, yOffset-4, 8, 8);
		if (this.moonset) ctx.fillRect(moonsetPx-4, yOffset-4, 8, 8);

		// text properties
		ctx.font = "12px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText(sunsetTimeStr, sunsetPx, yOffset-12);
		ctx.fillText(darkTimeStr, darkAstroPx, yOffset-12);
		ctx.fillText(dawnTimeStr, dawnAstroPx, yOffset-12);
		ctx.fillText(sunriseTimeStr, sunrisePx, yOffset-12);
		// TODO: make sure moon rise/set times don't overlap other times
		const moonTimePxGuard = 50;
		const moonTimePxGuardYOffset = 24;
		if (this.moonrise) {
			if ((Math.abs(moonrisePx - sunsetPx) < moonTimePxGuard) || (Math.abs(moonrisePx - sunrisePx) < moonTimePxGuard)
				|| (Math.abs(moonrisePx - darkAstroPx) < moonTimePxGuard) || (Math.abs(moonrisePx - dawnAstroPx) < moonTimePxGuard))
				ctx.fillText(moonriseTimeStr, moonrisePx, yOffset-moonTimePxGuardYOffset);
			else	
				ctx.fillText(moonriseTimeStr, moonrisePx, yOffset-12);
		}
		if (this.moonset) {
			if ((Math.abs(moonsetPx - sunsetPx) < moonTimePxGuard) || (Math.abs(moonsetPx - sunrisePx) < moonTimePxGuard)
				|| (Math.abs(moonsetPx - darkAstroPx) < moonTimePxGuard) || (Math.abs(moonsetPx - dawnAstroPx) < moonTimePxGuard))
				ctx.fillText(moonsetTimeStr, moonsetPx, yOffset-moonTimePxGuardYOffset);
			else
				ctx.fillText(moonsetTimeStr, moonsetPx, yOffset-12);
		}
	}
	
	update() {
		var updateFn = function() {
			if (this.run)
				this.dateTime = new Date();
			var timeStr = this.dateTime.toLocaleTimeString(this.locale, {timeZone: this.timeZone, hour: "numeric", minute: "2-digit"});
			var nowPx = (this.dateTime.getTime() - this.timeBegin.getTime())*this.timeToPx;
			var newPx = nowPx;
			
			this.pointer.innerHTML = '<br />' + timeStr;
			const halfWidth = this.pointer.offsetWidth/2;

			if (nowPx < 0) {
				newPx = 0;
				this.pointer.style.textAlign = 'left';
				this.pointer.innerHTML = '←<br />' + timeStr;
			} else if (nowPx < halfWidth) {
				newPx = nowPx - this.arrowHalfWidth;
				this.pointer.style.textAlign = 'left';
				this.pointer.innerHTML = '↑<br />' + timeStr;
			} else if (nowPx > this.timelineWidth) {
				newPx = this.timelineWidth - 2*halfWidth;
				this.pointer.style.textAlign = 'right';
				this.pointer.innerHTML = '→<br />' + timeStr;
			} else if (nowPx > this.timelineWidth - halfWidth) {
				newPx = nowPx - 2*halfWidth + this.arrowHalfWidth;
				this.pointer.style.textAlign = 'right';
				this.pointer.innerHTML = '↑<br />' + timeStr;
			} else {
				newPx -= halfWidth;
				this.pointer.style.textAlign = 'center';
				this.pointer.innerHTML = '↑<br />' + timeStr;				
			}

			this.pointer.style.left = newPx + 'px';
			
			this.nowPx = newPx; //this.pointer.style.left;
			
			if (this.run)
				setTimeout(updateFn, 1000);
			
			//var h = this.dateTime.toLocaleTimeString("en-GB", {timeZone: this.timezone, hour: "numeric"});
			//if (h >= this.rolloverHour) {
			//	var run = this.run;
			//	this.createWidget();
			//	if (!run) this.stop();
			//}
			
		}.bind(this);

		updateFn();
	}

	start() {
		this.run = true;
		this.update();
	}

	stop() {
		this.run = false;
	}
	
	debugInfo() {
		var html = "<table border='1px'>";
		html += "<tr><td colspan=2>All times in target time zone (" + this.timeZone + ") unless otherwise noted.</td></tr>\n";
		html +=	"<tr><td>Now</td><td>" +this.dateTime.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Now (Browser's Location)</td><td>" +this.dateTime.toLocaleString(this.locale) + "</td></tr>\n";
		html +=	"<tr><td>Time Zone Offset</td><td>" +this.tzOffsetTarget + "</td></tr>\n";
		html +=	"<tr><td>Time Zone Offset (Browser's Location)</td><td>" +this.tzOffsetBrowser + "</td></tr>\n";
		html +=	"<tr><td>Net Time Zone Offset</td><td>" +this.tzOffset + "</td></tr>\n";
		html += "<tr><td>Current Hour</td><td>" +this.h + "</td></tr>\n";
		html +=	"<tr><td>Day 1</td><td>" +this.day1.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Day 2</td><td>" +this.day2.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Sunset</td><td>" +this.sunset.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Astronomical Dark</td><td>" +this.darkAstro.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Astronomical Dawn</td><td>" +this.dawnAstro.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Sunrise</td><td>" +this.sunrise.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Moonrise</td><td>" +this.moonrise.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html +=	"<tr><td>Moonset</td><td>" +this.moonset.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html += "<tr><td>Timeline Start</td><td>" +this.timeBegin.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html += "<tr><td>Timeline End</td><td>" +this.timeEnd.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html += "<tr><td>Sunset</td><td>" +this.sunset.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html += "<tr><td>Sunrise</td><td>" +this.sunrise.toLocaleString(this.locale, {timeZone: this.timeZone}) + "</td></tr>\n";
		html += "<tr><td>div Width</td><td>" +this.timelineWidth + "</td></tr>\n";
		html += "<tr><td>nowPx</td><td>" +this.nowPx + "</td></tr>\n";
		/*
		html +=	"<tr><td colspan=99>Suncalc debug</td></tr>\n";
		html += "<tr><td>Local Time</td><td>Date Error</td><td>Sunrise</td><td>Sunset</td></tr>\n";
			var dt = new Date(2020, 6, 15, 0, 0, 0);
			var step = 1*60*1000;
			for (var i = 0; i < 24*60*60*1000; i += step) {
				var sunTimes = SunCalc.getTimes(this.correctDate(dt), this.lat, this.lon, this.alt);
				html += '<tr><td>' + dt.toLocaleString('en-US', {timeZone: this.timeZone}) + '</td>' 
				html += '<td>' + (this.yyyymmdd(dt) - this.yyyymmdd(sunTimes['sunset'])) + '</td>';
				//html += '<td>' + dt.toUTCString() + '</td>' 
				html += '<td>' + sunTimes['sunrise'].toLocaleString('en-US', {timeZone: this.timeZone}) + '</td>';
				html += '<td>' + sunTimes['sunset'].toLocaleString('en-US', {timeZone: this.timeZone}) + '</td></tr>\n';
				dt.setMilliseconds(dt.getMilliseconds() + step);
			}
		*/
		html += "</table>\n";
		return html;
	}

}