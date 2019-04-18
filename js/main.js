/* Stylesheet by Yifeng Ai, 2019 */
//initialize function called when the script loads
(function() {
var attrArray = ["gdp_1980","gdp_1985","gdp_1990","gdp_1995","gdp_2000","gdp_2005","gdp_2008","gdp_2009","gdp_2010"];
var expressed = attrArray[8]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 35,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([460, 0])
    .domain([0, 20000]);

window.onload = setMap()

function setMap() {
 //map frame dimensions
    var width = window.innerWidth * 0.5
        height = window.innerHeight * 0.9;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Asia
    var projection = d3.geoAlbers()
        .center([3.64,36.33])
        .rotate([-91, 7.27, 0])
        .parallels([18.36,52])
        .scale(400)
        .translate([width / 2, height / 2]);
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/China_province_data.csv")); //load attributes from csv
    promises.push(d3.json("data/Asia_countries.topojson")); //load background spatial data
    promises.push(d3.json("data/China_provinces.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data) {
	    csvData = data[0];
	    asia = data[1];
        china = data[2];
        
        setGraticule(map,path)

        // get geographic paths from Asia_countries and China_provinces
        var asia_countries = topojson.feature(asia, asia.objects.Asia_countries),
            china_provinces = topojson.feature(china, china.objects.China_provinces).features

        // append the path from countries
        var countries = map.append("path")
            .datum(asia_countries)
            .attr("class", "countries")
            // data will be projected according to variable path
            .attr("d", path);
        
        china_provinces = joinData(china_provinces,csvData)

        var colorScale = makeColorScale(csvData)

        createDropdown()
        setEnumerationUnits(china_provinces,map,path,colorScale)

        setChart(csvData, colorScale)

       //changeAttribute(attribute, csvData)
        }
    }

function setChart(csvData, colorScale){
    //chart frame dimensions
    /*var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 35,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    */
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    /*var yScale = d3.scaleLinear()
        .range([460, 0])
        .domain([0, 20000]);
    */
    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            console.log('aaaaa',d.Admin_division,d)
            return "bar " + d.Admin_division/*Admin_division*/;
        })
        
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel)

        //below Example 2.2 line 31...add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

        //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.ADM1_EN;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })

        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .text(function(d){
            return d[expressed];
        });

    /*
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("GDP of year 2010 in each province");*/

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    updateChart(bars, csvData.length, colorScale)
        
        /*.attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });*/

    //create a text element for the chart title

};

function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];
    
        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);
    
        return colorScale;
    };

function setGraticule(map,path) {
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
}

function joinData(china_provinces,csvData) {
    //loop through csv to assign each set of csv attribute values to geojson region
    newProvArr = []
    for (var i = 0; i < csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Admin_division; //the CSV primary key
        var cKey_abbrev = csvKey.split(' ')[0]
    
        //loop through geojson regions to find correct region
        for (var a = 0; a < china_provinces.length; a++){
    
            var geojsonProps = china_provinces[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.ADM1_EN; //the geojson primary key
            //console.log('geojsonKey',geojsonKey)
            var gKey_abbrev = (geojsonKey.split(' '))[0];  //the first letter that indicates province name can match with csv key
    
            //where primary keys match, transfer csv data to geojson properties object
            if (cKey_abbrev == gKey_abbrev){
                newProvArr.push(geojsonProps)

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        }
    }
    return china_provinces
}

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    console.log('kkkkk',props)
    var selected = d3.selectAll("." + props.ADM1_EN)
        .style("stroke", "#ffffff")
        .style("stroke-width", "2");
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
        //below Example 2.4 line 21...remove info label
    d3.select(".infolabel")
        .remove();
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel(){
    //use coordinates of mousemove event to set label coordinates
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function setEnumerationUnits(china_provinces,map,path,colorScale) {
    //add France regions to map

    var provinces = map.selectAll(".provinces")
        .data(china_provinces)
        .enter()
        .append("path")
        .attr("class", function(d) {
            return "provinces " + d.properties.ADM1_EN;
        })
        // data will be projected accodingto variable path
        .attr("d", path)
        .style('fill', function(d) {
            return choropleth(d.properties,colorScale)
        })
        .on("mouseover", function(d){
            console.log('llllll',d.properties)
            highlight(d.properties)
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
        });
    var desc = provinces.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    }

function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
function createDropdown(){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on('change', function() {
            changeAttribute(this.value, csvData)
        })

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

function changeAttribute(attribute, csvData) {
    // change expressed visual variables on map polygons
    expressed = attribute;
    var colorScale = makeColorScale(csvData)
    
    var provinces = d3.selectAll('.provinces')
        .transition()
        .duration(1000)
        .style('fill', function(d) {
            return choropleth(d.properties, colorScale)
        })
    
    // re-sort, recolor and resize bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);
    }

function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) + leftPadding;
        })
    //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
            
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
             return choropleth(d, colorScale);
        });
            //at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
    };

            //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.ADM1_EN;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .text(function(d){
            return d[expressed];
        });

})()
