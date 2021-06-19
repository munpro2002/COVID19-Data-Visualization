import { feature } from 'topojson';
import { csv, json } from 'd3';
export const loadAndProcessData = () =>
  Promise
    .all([
      csv('covid-data.csv'),
      json('https://unpkg.com/visionscarto-world-atlas@0.0.4/world/50m.json')
    ])
    .then(([covidData, topoJSONdata]) => {
      console.log(covidData)
      const rowById = covidData.reduce((accumulator, d) => {
        accumulator[d['country code']] = d;
        return accumulator;
      }, {});

      const countries = feature(topoJSONdata, topoJSONdata.objects.countries);

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