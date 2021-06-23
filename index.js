import {
	select,
	geoPath,
	geoCentroid,
	geoEquirectangular,
	zoom,
	event,
	scaleOrdinal,
	schemeSpectral,
	scaleSqrt,
	max,
	format
} from 'd3';
import { loadAndProcessData } from './loadAndProcessData';
import { sizeLegend } from './sizeLegend';

const svg = select('svg');

const projection = geoEquirectangular();
const pathGenerator = geoPath().projection(projection);
const radiusValue = d => d.properties['172020'];

const g = svg.append('g');

const colorLegendG = svg.append('g').attr('transform', `translate(40,310)`);

g.append('path')
	.attr('class', 'sphere')
	.attr('d', pathGenerator({ type: 'Sphere' }));

svg.call(zoom().on('zoom', () => {
	g.attr('transform', event.transform);
}));

const totalCaseFormat = format(',');

loadAndProcessData().then(countries => {
	const sizeScale = scaleSqrt();
	sizeScale
		.domain([0, 2694053])
		.range([0, 35]);

	g.selectAll('path').data(countries.features)
		.enter().append('path')
		.attr('class', 'country')
		.attr('d', pathGenerator)
		.attr('fill', d => d.properties['172020'] ? '#d8d8d8' : '#fec1c1')
		.append('title')
		.text(d => isNaN(radiusValue(d))
			? 'Missing data'
			: [
				(d.properties['location']),
				totalCaseFormat(radiusValue(d))
			].join(': '));

	countries.featuresWithCovidCase.forEach(d => {
		d.properties.projected = projection(geoCentroid(d));
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