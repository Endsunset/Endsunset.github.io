# Maps

Map providers supply the geographic context and place information shown in LinkMap.

## Providers by region

LinkMap uses Apple's map services to display maps and find places. The underlying provider can depend on the region:

- **Apple Maps** provides the map services used by LinkMap.
- **Amap (Gaode)** supplies mapping services for Apple Maps in **Chinese mainland**. See [Apple's map service information](https://www.apple.com/legal/privacy/data/en/apple-maps/) for this regional provider relationship.

## Coordinate systems and offsets

The same place can have different latitude and longitude values in different coordinate systems:

- **WGS 84** is commonly used by GPS devices.
- **GCJ-02** is used by Amap in Chinese mainland.

Displaying coordinates from one system on a map expecting another can place a marker away from its intended location. This mismatch causes a positional offset. See [Amap's coordinate-system guidance](https://developer.amap.com/api/javascript-api-v2/guide/transform/convertfrom).

When copying coordinates between providers or entering them in LinkMap, check which system the source uses and which the destination expects. Convert between systems where needed, then compare the marker with the intended place. Do not assume that the same numbers are interchangeable across providers.

## Your Project on the map

Your Project Locations appear as markers on the map. On iOS, selecting an Activity adds its Routes, and selecting an Assignment focuses the view on that team's work. See <doc:Map> and <doc:Locations> for working with your Project's places.

## Find places on the web

Search for a place or address to move the map to a result and inspect its details when available. You can also show a latitude and longitude pair and copy the coordinates. These web tools work without signing in; viewing your own or shared Projects requires your Apple Account.

See <doc:Web-Platform> for the web tools and <doc:iOS-Platform> for creating and editing Project Locations.

## Map services and privacy

Map display and place search may send requests to Apple. See the [privacy policy](https://endsunset.github.io/linkmap/privacy-policy/) for how map-related information is handled.
