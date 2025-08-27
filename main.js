import { format } from 'ol/coordinate';
import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import {Fill, Stroke, Style, Icon} from 'ol/style';
import {fromLonLat} from 'ol/proj';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {get as getProjection} from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { ImageTile, TileJSON } from 'ol/source';
import apply from 'ol-mapbox-style';
import { GeocodingControl } from "@maptiler/geocoding-control/openlayers";
import "@maptiler/geocoding-control/style.css";

// Define a projeção UTM Zona 23S (Pará de Minas-MG está na zona 23)
proj4.defs('EPSG:31983', '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs');
register(proj4);

const utmProjection = getProjection('EPSG:31983');

// Definir atribuição do MapTiler
const attribution = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>';
const key = import.meta.env.VITE_MAPTILER_KEY;
console.log('MapTiler Key:', key);
const styleJson = 'https://api.maptiler.com/maps/0198c90f-3b4c-7b60-ac28-d71632db167c/style.json?key='+ key;
const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat([-44.61109, -19.85329]), // Centro de Pará de Minas
    zoom: 14,
    minZoom: 13, // Permite ver a cidade inteira
    maxZoom: 18, // Bom nível de detalhe
    constrainResolution: true,
    extent: [
      -4989000, -2271000,  // Sudoeste (mais a oeste e mais ao sul)
      -4948000, -2235000   // Nordeste (mais a leste e mais ao norte)
    ]
  })
});

apply(map, styleJson);

const mapLayer = new TileLayer({
      source: new TileJSON({
        url: 'https://api.maptiler.com/tiles/satellite-v2/tiles.json?key='+ key,
        attributions: attribution,
      })
    });

    //map.addLayer(mapLayer);

const residentialLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON({
      dataProjection: 'EPSG:31983',  // UTM Zona 23S (Pará de Minas-MG)
      featureProjection: 'EPSG:3857'  // Projeção do mapa base (OpenStreetMap)
    }),
    url: 'https://api.maptiler.com/data/0198cc6d-4785-73df-a953-ead9851afbb0/features.json?key='+ key
  }),
  zIndex: 1,
  style: new Style({
    stroke: new Stroke({
      color: '#000',
      width: 1
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.67)'
    })
  })
});

map.addLayer(residentialLayer);

// Criar elemento e overlay para o tooltip
const tooltipElement = document.createElement('div');
tooltipElement.className = 'marker-tooltip';
const tooltip = new Overlay({
  element: tooltipElement,
  offset: [0, -20],
  positioning: 'bottom-center'
});
map.addOverlay(tooltip);

// Criar fonte e camada para os marcadores de busca
const searchMarkerSource = new VectorSource();
const searchMarkerLayer = new VectorLayer({
  source: searchMarkerSource,
  zIndex: 3,
  style: new Style({
    image: new Icon({
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      scale: 0.5
    })
  })
});
map.addLayer(searchMarkerLayer);

// Adicionar o controle de geocodificação do MapTiler
const geocoder = new GeocodingControl({
  apiKey: key,
  language: 'pt',
  country: 'br',
  proximity: [-44.61109, -19.85329], // Centro de Pará de Minas
  bbox: [-44.65, -19.89, -44.57, -19.82], // Limites aproximados de Pará de Minas
});

map.addControl(geocoder);

// Listener para quando um local é selecionado
geocoder.on('select', (e) => {
  if (!e.feature) return;
  
  const coordinates = e.feature.geometry.coordinates;
  const properties = e.feature.properties;
  
  // Verifica se o resultado é em Pará de Minas
  // const city = properties.city || '';
  // const context = properties.context || [];
  // const isParaDeMinas = 
  //   city.toLowerCase().includes('pará de minas') ||
  //   context.some(c => c.text.toLowerCase().includes('pará de minas'));
  
  // if (!isParaDeMinas) {
  //   alert('Por favor, selecione um endereço em Pará de Minas.');
  //   return;
  // }
  
  // Limpa marcadores anteriores
  searchMarkerSource.clear();
  
  // Formata o endereço
  const street = properties.street || '';
  const houseNumber = properties.housenumber ? `, ${properties.housenumber}` : '';
  const neighborhood = properties.neighborhood ? ` - ${properties.neighborhood}` : '';
  const formattedAddress = `${street}${houseNumber}${neighborhood}`;
  
  // Adiciona novo marcador
  const marker = new Feature({
    geometry: new Point(fromLonLat(coordinates)),
    name: formattedAddress,
    fullAddress: properties.formatted
  });
  searchMarkerSource.addFeature(marker);
  
  // Centraliza o mapa na localização encontrada
  map.getView().animate({
    center: fromLonLat(coordinates),
    zoom: 18,
    duration: 1000
  });
  
  // Atualiza o tooltip
  // tooltipElement.innerHTML = `<strong>${formattedAddress}</strong><br>${properties.formatted}`;
  // tooltip.setPosition(fromLonLat(coordinates));
});

// Adicionar interação com o marcador
// map.on('pointermove', function(e) {
//   const feature = map.forEachFeatureAtPixel(e.pixel, function(feature) {
//     return feature;
//   });

//   if (feature) {
//     const name = feature.get('name');
//     const fullAddress = feature.get('fullAddress');
//     tooltipElement.innerHTML = `<strong>${name}</strong>${fullAddress ? `<br>${fullAddress}` : ''}`;
//     tooltip.setPosition(e.coordinate);
//     tooltipElement.style.display = 'block';
//   } else {
//     tooltipElement.style.display = 'none';
//   }
// });



// Adicionar interação com o marcador
// map.on('pointermove', function(e) {
//   const feature = map.forEachFeatureAtPixel(e.pixel, function(feature) {
//     return feature;
//   });

//   if (feature) {
//     const name = feature.get('name');
//     const fullAddress = feature.get('fullAddress');
//     tooltipElement.innerHTML = `<strong>${name}</strong>${fullAddress ? `<br>${fullAddress}` : ''}`;
//     tooltip.setPosition(e.coordinate);
//     tooltipElement.style.display = 'block';
//   } else {
//     tooltipElement.style.display = 'none';
//   }
// });

// Adiciona funcionalidade de busca
// async function searchAddress(query) {
//   try {
//     // Separa o número da rua do resto do endereço
//     let streetName = query;
//     let houseNumber = '';
    
//     // Procura por padrões comuns de número (ex: "Rua ABC, 123" ou "Rua ABC 123")
//     const numberMatch = query.match(/[,\s]+(\d+)\s*$/);
//     if (numberMatch) {
//       houseNumber = numberMatch[1];
//       streetName = query.replace(/[,\s]+\d+\s*$/, '').trim();
//     }

//     // Estrutura a busca com parâmetros específicos para melhor precisão
//     const params = new URLSearchParams({
//       format: 'json',
//       addressdetails: 1,
//       limit: 10,
//       countrycodes: 'br',
//       city: 'Pará de Minas',
//       state: 'Minas Gerais',
//       country: 'Brasil',
//       street: `${houseNumber} ${streetName}`.trim() // Formato correto para o Nominatim: "número rua"
//     });

//     const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
//     const data = await response.json();
    
//     if (data && data.length > 0) {
//       // Filtra e ordena os resultados
//       const results = data.sort((a, b) => {
//         if (!a.address || !b.address) return 0;
        
//         // Se um número específico foi buscado, prioriza correspondências exatas
//         if (houseNumber) {
//           const aMatchesNumber = a.address.house_number === houseNumber;
//           const bMatchesNumber = b.address.house_number === houseNumber;
//           if (aMatchesNumber !== bMatchesNumber) {
//             return aMatchesNumber ? -1 : 1;
//           }
//         }

//         // Depois prioriza endereços que têm qualquer número
//         const aHasNumber = a.address.house_number ? 1 : 0;
//         const bHasNumber = b.address.house_number ? 1 : 0;
//         return bHasNumber - aHasNumber;
//       });

//       const result = results[0];
//       const lon = parseFloat(result.lon);
//       const lat = parseFloat(result.lat);
      
//       // Limpa marcadores anteriores
//       markerSource.clear();
      
//       // Formata o endereço de forma mais amigável
//       const address = result.address;
//       let formattedAddress = '';
//       if (address) {
//         const roadName = address.road || '';
//         const houseNumber = address.house_number ? `, ${address.house_number}` : '';
//         const suburb = address.suburb ? ` - ${address.suburb}` : '';
//         formattedAddress = `${roadName}${houseNumber}${suburb}`;
//       } else {
//         formattedAddress = result.display_name;
//       }
      
//       // Adiciona novo marcador
//       const marker = new Feature({
//         geometry: new Point(fromLonLat([lon, lat])),
//         name: formattedAddress,
//         fullAddress: result.display_name // Guarda o endereço completo para o tooltip
//       });
//       markerSource.addFeature(marker);
      
//       // Centraliza o mapa na localização encontrada
//       map.getView().animate({
//         center: fromLonLat([lon, lat]),
//         zoom: Math.min(Math.max(map.getView().getZoom(), 17), 18), // Mantém o zoom entre 17 e 18
//         duration: 1000
//       });

//       // Atualiza o campo de busca com o endereço completo
//       document.getElementById('search-input').value = formattedAddress;

//       // Verifica se o número encontrado corresponde ao número buscado
//       if (houseNumber && (!result.address.house_number || result.address.house_number !== houseNumber)) {
//         alert(`Atenção: Não foi possível encontrar exatamente o número ${houseNumber}. Mostrando a localização mais próxima encontrada.`);
//       }
//     } else {
//       alert('Endereço não encontrado. Tente incluir o número da casa (exemplo: Rua São Paulo, 123)');
//     }
//   } catch (error) {
//     console.error('Erro na busca:', error);
//     alert('Erro ao buscar endereço');
//   }
// }

// Adiciona eventos aos elementos de busca
document.getElementById('search-button').addEventListener('click', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput.value.trim()) {
    searchAddress(searchInput.value);
  }
});

// document.getElementById('search-input').addEventListener('keypress', (event) => {
//   if (event.key === 'Enter') {
//     const searchInput = document.getElementById('search-input');
//     if (searchInput.value.trim()) {
//       searchAddress(searchInput.value);
//     }
//   }
// });
