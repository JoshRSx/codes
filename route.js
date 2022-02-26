       function updateRoute() {
            const authentication = new arcgisRest.ApiKey({
              key: apiKey
            });
            arcgisRest
    
              .solveRoute({
                stops: [startCoords, endCoords],
                authentication
              })
    
              .then((response) => {
    
                routeLayer.setSource(
                  new ol.source.Vector({
                    features: geojson.readFeatures(response.routes.geoJson)
                  })
                );
    
                const directionsHTML = response.directions[0].features.map((f) => f.attributes.text).join("<br/>");
                document.getElementById("directions").innerHTML = directionsHTML;
                document.getElementById("directions").style.display = "block";
    
              })
    
              .catch((error) => {
                alert("Hubo un problema. Verificar consola JS");
                console.error(error);
              });
              var lat1str = startCoords.toString();
              var lat1 = lat1str.substring(0,8);

              var long1str = startCoords.toString();
              var lon1 = long1str.substring(19,27);

              var lat2str = endCoords.toString();
              var lat2 = lat2str.substring(0,8);

              var long2str = endCoords.toString();
              var lon2 = long2str.substring(19,27);

              document.getElementById("coord").innerHTML="Las coordenadas de inicio: "+lat1+", "+lon1+"\nLas coordenadas finales "+lat2+", "+lon2+"\n La distancia es de "+getDistanciaMetros()+" metros";

              //Coordenadas
              console.log(startCoords);
              console.log(endCoords);
          }


    
          const basemapId = "ArcGIS:Navigation";
    
          const basemapURL = "https://basemaps-api.arcgis.com/arcgis/rest/services/styles/" + basemapId + "?type=style&token=" + apiKey;
    
          olms(map, basemapURL)
    
    
            .then(function (map) {
              addCircleLayers();
    
              addRouteLayer();
    
            });
