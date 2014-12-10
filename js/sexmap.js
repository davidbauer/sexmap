// CONFIG
var config = { 
	years: d3.range(1961,2014) // maximum value not included
	} 

// STATE
// store all input parameters for the visualisation in state so that we always know what state the visualisation is in

var state = {
	currentYear:d3.max(config.years), 
	countries: [],
	world: null
};

// ACTIONS

var actions = {
	updateYear : function(year) {
		state.currentYear = +year; // + turns strings into numbers
		render();
	},
	updateData : function(rows) {
		state.countries = rows;
		render();
	},
	playTimeline : function() {
		state.currentYear = d3.min(config.years);
		setInterval(function(){
			state.currentYear += 1;
			render();
		},1000)
		}
}



// RENDERING

function render() { // make one render() function and call all functions to render sub-elements within 
	
	renderMenu();
	renderText();
	renderBarchart();
	// drawGlobe();
	if (state.world && state.countries.length > 0) renderMap();

} 

// RENDERING FUNCTIONS

function renderMenu() {

	var menu = d3.select('#menu').selectAll('select').data([0]);

	menu.enter()
		.append('select');

	var options = menu.selectAll('option')
		.data(config.years);
	
	options.enter()
		.append('option');

	options
		.text(function(d) {return d}) // go through all d in data and append an option with value d to the select
		.attr('selected',function(d) {return d === state.currentYear ? 'selected' : null}); 

	options.exit()
		.remove();

	menu.on('change', function(d) {
		actions.updateYear(this.value);
	})
}

function renderText() {
	d3.select('.currentYear').text(state.currentYear);
}

function renderBarchart() {
	
	var x = d3.scale.linear()
		.domain([0,d3.max(state.countries, function(d) {return d[state.currentYear]})]) // input, from zero to max value
		.range([0,1000]); // output

	state.countries.sort(function(a,b) {
			return d3.descending(a[state.currentYear], b[state.currentYear]);
	})

	var bars = d3.select('#chart').selectAll('.bar').data(state.countries); // save all bars even though they don't exist yet, hooray!

	bars.enter().append('div')
		.attr('class','bar');

	bars.text(function(d) {return d.name + ": " + d[state.currentYear]})
		.style('background', function(d) {return d[state.currentYear] > 50 ? 'steelblue' : 'pink'})
		.style('width', function (d) {return x(d[state.currentYear]) + 'px'})


	bars.exit().remove();
}

function renderMap() {
	var width = 960,
    height = 960;

	var projection = d3.geo.orthographic()
	    .scale(475)
	    .translate([width / 2, height / 2])
	    .clipAngle(90)
	    .precision(.1);

	var path = d3.geo.path()
	    .projection(projection);

	var graticule = d3.geo.graticule();

	var map = d3.select("#map").selectAll('svg').data([0]);

	var svg = map.enter()
		.append("svg")
	    .attr("width", width)
	    .attr("height", height);

	svg.append("defs").append("path")
	    .datum({type: "Sphere"})
	    .attr("id", "sphere")
	    .attr("d", path);

	svg.append("use")
	    .attr("class", "stroke")
	    .attr("xlink:href", "#sphere");

	svg.append("use")
	    .attr("class", "fill")
	    .attr("xlink:href", "#sphere");

	svg.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);

	var countries = map.selectAll('.country').data(topojson.feature(state.world, state.world.objects.countries).features);
	  
	countries.enter()
	  	.insert("path", ".graticule")
	    .attr("class", "country")
	    .attr("id", function(d) { return "country-" + d.id;})
	    .attr("d", path);

	svg.insert("path", ".graticule")
      .datum(topojson.mesh(state.world, state.world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

	// TODO color counties according to their value for current year
	// compare d.id with id in countries array
	// return value for current year for that country

	countries
		.style('fill', function(d) {
			var countryData = _.findWhere(state.countries, {id: +d.id});
			if (countryData) {
				return countryData[state.currentYear] > 50 ? 'steelblue' : 'pink';
			}
			return 'gray';
		});
}


// TODO: function drawGlobe() {}



// START

// load the world
d3.json("data/world-110m.json", function(error, world) {
	  
	if (error) {
		console.error(error);
		return;
	}

	state.world = world;
});

//load the data and prepare it
d3.csv('data/sexratios.csv')
	.row(function(d) { // go through all rows and make sure values are saved as numbers
		
		var row = { // save values for all columns that we need
			id: +d.ISO, 
			name: d['Country Name']
		}

		config.years.forEach(function(year){ // save value for each year in a property with the year's name
			row[year] = +d[year]
		})

		return row;

	}) 
    .get(function(error, rows){
		if (error) {
			console.error(error);
			return;
		}

		actions.updateData(rows);
	});

render(); // start rendering

d3.select('.play').on("click", actions.playTimeline);


// it's the end of the code as we know it