(function (d3, topojson) {
  'use strict';

  const loadAndProcessData = () =>
    Promise
      .all([
        d3.csv('covid-data.csv'),
        d3.json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json')
      ])
      .then(([covidData, topoJSONdata]) => {
        console.log(covidData);
        const rowById = covidData.reduce((accumulator, d) => {
          accumulator[d['country code']] = d;
          return accumulator;
        }, {});

        const countries = topojson.feature(topoJSONdata, topoJSONdata.objects.countries);

        countries.features.forEach(d => {
          Object.assign(d.properties, rowById[d.id]);
        });

        const featuresWithCovidCase = countries.features
          .filter(d => d.properties['172020'])
          .map(d => {
            d.properties['172020'] = d.properties['172020'];
            return d;
          });



        return {
          features: countries.features,
          featuresWithCovidCase
        };
      });

  const sizeLegend = (selection, props) => {
    const {
      sizeScale,
      spacing,
      textOffset,
      numTicks,
      tickFormat
    } = props;

    const ticks = sizeScale.ticks(numTicks)
      .filter(d => d !== 0)
      .reverse();

    const groups = selection.selectAll('g').data(ticks);
    const groupsEnter = groups
      .enter().append('g')
      .attr('class', 'tick');
    groupsEnter
      .merge(groups)
      .attr('transform', (d, i) =>
        `translate(0, ${i * spacing})`
      );
    groups.exit().remove();

    groupsEnter.append('circle')
      .merge(groups.select('circle'))
      .attr('r', sizeScale);

    groupsEnter.append('text')
      .merge(groups.select('text'))
      .text(tickFormat)
      .attr('dy', '0.32em')
      .attr('x', d => sizeScale(d) + textOffset);

  };

  const svg = d3.select('svg');

  const projection = d3.geoEquirectangular();
  const pathGenerator = d3.geoPath().projection(projection);
  const radiusValue = d => d.properties['172020'];

  const g = svg.append('g');

  const colorLegendG = svg.append('g').attr('transform', `translate(40,310)`);

  g.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({ type: 'Sphere' }));

  svg.call(d3.zoom().on('zoom', () => {
    g.attr('transform', d3.event.transform);
  }));

  const totalCaseFormat = d3.format(',');

  loadAndProcessData().then(countries => {
    const sizeScale = d3.scaleSqrt();
    sizeScale
      .domain([0, 2694053])
      .range([0, 30]);

    g.selectAll('path').data(countries.features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
      .attr('fill', d => d.properties['172020'] ? '#d8d8d8' : '#fec1c1')
      .append('title')
      .text(d => isNaN(radiusValue(d))
        ? '0 cases confirmed'
        : [
          (d.properties['location']),
          totalCaseFormat(radiusValue(d))
        ].join(': '));

    countries.featuresWithCovidCase.forEach(d => {
      d.properties.projected = projection(d3.geoCentroid(d));
    });

    g.selectAll('circle').data(countries.featuresWithCovidCase)
      .enter().append('circle')
      .attr('class', 'country_circle')
      .attr('cx', d => d.properties.projected[0])
      .attr('cy', d => d.properties.projected[1])
      .attr('r', d => sizeScale(radiusValue(d)));

    g.append('g')
      .attr('transform', `translate(50,150)`)
      .call(sizeLegend, {
        sizeScale,
        spacing: 50,
        textOffset: 10,
        numTicks: 5,
        tickFormat: totalCaseFormat
      })
      .append('text')
      .attr('class', 'legend-title')
      .text('Total cases')
      .attr('y', -35)
      .attr('x', -30)
      ;
  });

}(d3, topojson));

