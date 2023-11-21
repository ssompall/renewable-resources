// Set the margins
var margin = { top: 100, right: 10, bottom: 100, left: 100 },
    width = 800 - margin.left - margin.right,
    height = 950 - margin.top - margin.bottom;

// Parse the year variable
var parseYear = d3.timeParse("%Y");
var formatYear = d3.timeFormat("%Y");

// Set the ranges
var x = d3.scaleTime().domain([new Date(1985, 0, 1), new Date(2020, 0, 1)]).range([0, width]);
var y2 = d3.scaleLinear().range([height, 0]);

// Create the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");


tooltip.append("rect")
    .attr("width", 60)
    .attr("height", 10);


tooltip.append("text")
    .attr("x", 40)
    .attr("dy", "1.2em")

// Define the line
var valueLine = d3.line()
    .x(function (d) { return x(d.Year); })
    .y(function (d) { return y2(+d.ConsumptionValue); })

// Create the svg canvas in the "graph" div
var nonrenewableSVG = d3.select("#nonrenewableGraph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "svg");

// Import the CSV data
d3.csv("nonrenewableenergydata.csv", function (error, data) {
    if (error) throw error;

    data = data.filter(function (d) {
        return parseYear(d.Year).getFullYear() >= 1985;
    })

    // Format the data
    data.forEach(function (d) {

        d.Year = parseYear(d.Year);
        d.ConsumptionValue = +d.ConsumptionValue;
        d.ConsumptionType = d.ConsumptionType;
        d.State = d.State;
    });

    var nest = d3.nest()
        .key(function (d) {
            return d.ConsumptionType;
        })
        .rollup(function (leaves) {
            var max = d3.max(leaves, function (d) {
                return d.ConsumptionValue
            })
            var state = d3.nest().key(function (d) {
                return d.State
            })
                .entries(leaves);
            return { max: max, state: state };
        })
        .entries(data)

    // Scale the range of the data
    x.domain(d3.extent(data, function (d) { return d.Year; }));
    y2.domain([0, d3.max(data, function (d) { return d.ConsumptionValue; })]);

    // Set up the x axis
    var xaxis = nonrenewableSVG.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis")
        .call(d3.axisBottom(x)
            .ticks(20));

    // Create 1st dropdown
    var NRConsumptionTypeMenu = d3.select("#nonrenewableDropdown")

    NRConsumptionTypeMenu
        .append("select")
        .selectAll("option")
        .data(nest)
        .enter()
        .append("option")
        .attr("value", function (d) {
            return d.key;
        })
        .text(function (d) {
            return d.key;
        })

    // Create 2nd dropdown
    var stateMenu = d3.select("#nonrenewablestateDropdown")

    stateMenu
        .data(nest)
        .append("select")
        .selectAll("option")
        .data(function (d) { return d.value.state; })
        .enter()
        .append("option")
        .attr("value", function (d) {
            return d.key;
        })
        .text(function (d) {
            return d.key;
        })


    // Function to create the initial graph
    var initialGraph = function (ConsumptionType) {

        // Filter the data to include only ConsumptionType of interest
        var selectConsumptionType = nest.filter(function (d) {
            return d.key == ConsumptionType;
        })


        var selectConsumptionTypeGroups = nonrenewableSVG.selectAll(".ConsumptionTypeGroups")
            .data(selectConsumptionType, function (d) {
                return d ? d.key : this.key;
            })
            .enter()
            .append("g")
            .attr("class", "ConsumptionTypeGroups")
            .each(function (d) {
                y2.domain([0, d.value.max])
            });

        var initialPath = selectConsumptionTypeGroups.selectAll(".line")
            .data(function (d) { return d.value.state; })
            .enter()
            .append("path")

        initialPath
            .attr("d", function (d) {
                return valueLine(d.values)
            })
            .attr("class", "line")
            .style("stroke", "#000080")
            .style("stroke-width", "1px")
        // .append("title") // Add a title element for tooltips
        // .text(function (d) {
        //   return d.key; // Display the state name as the tooltip
        // });

        // Add the tooltip mouseover and mouseout events
        initialPath.on("mouseover", function (d) {
            tooltip.html(d.key)
                .style("visibility", "visible")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
            .on("mouseout", function (d) {
                return tooltip.style("visibility", "hidden");
            });

        // Add the Y Axis
        var yaxis = nonrenewableSVG.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y2)
                .ticks(10));

        // Add a label to the y axis
        nonrenewableSVG.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 60)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Consumption Value (in BTU)")
            .attr("class", "y axis label");

    }
    
    // Create initial graph
    initialGraph("Consumption.Commercial.Natural Gas")


    // Update the data
    var updateGraph = function (ConsumptionType) {

        // Filter the data to include only ConsumptionType of interest
        var selectConsumptionType = nest.filter(function (d) {
            return d.key == ConsumptionType;
        })

        // Select all of the grouped elements and update the data
        var selectConsumptionTypeGroups = nonrenewableSVG.selectAll(".ConsumptionTypeGroups")
            .data(selectConsumptionType)
            .each(function (d) {
                y2.domain([0, d.value.max])
            });

        // Select all the lines and transition to new positions
        selectConsumptionTypeGroups.selectAll("path.line")
            .data(function (d) { return d.value.state; },
                function (d) { return d.key; })
            .transition()
            .duration(1000)
            .attr("d", function (d) {
                return valueLine(d.values)
            })

        // Add the tooltip mouseover and mouseout events
        selectConsumptionTypeGroups.selectAll(".line")
            .on("mouseover", function (d) {
                tooltip.html(d.key)
                    .style("visibility", "visible")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                return tooltip.style("visibility", "hidden");
            });

        // Update the Y-axis
        d3.select(".y")
            .transition()
            .duration(1500)
            .call(d3.axisLeft(y2)
                .ticks(5)
                .tickSizeInner(0)
                .tickPadding(6)
                .tickSize(0, 0));

    }

    // Run update function when dropdown selection changes
    NRConsumptionTypeMenu.on('change', function () {

        // Find which ConsumptionType was selected from the dropdown
        var selectedConsumptionType = d3.select(this)
            .select("select")
            .property("value")

        // Run update function with the selected ConsumptionType
        updateGraph(selectedConsumptionType)
    });

    // Change color of selected line when state dropdown changes
    stateMenu.on('change', function () {
        // Find which state was selected
        var selectedState = d3.select(this)
            .select("select")
            .property("value")

        nonrenewableSVG.selectAll(".line")
            .style("stroke", function (d) {
                return d.key == selectedState ? "red" : "#000080";
            })
            .style("stroke-width", function (d) {
                return d.key == selectedState ? 3 : 1;
            })
            .style("opacity", function (d) {
                return d.key == selectedState ? 1 : .5;
            })
    });


})