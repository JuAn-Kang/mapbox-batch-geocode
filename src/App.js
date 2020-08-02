import React, { useState, useEffect } from "react";
import "./App.css";
import { Button, Container, Table, Input, Icon } from "semantic-ui-react";
import CSVReader from "react-csv-reader";
import useLocalStorage from "react-use-localstorage";

function App() {
  const [mbToken, SetMbToken] = useLocalStorage("access_token");
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [lines, setLines] = useState([]);
  const handleFileLoaded = (data, fileInfo) => {
    setLines(data);
  };

  const parseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().replace(/\W/g, "_"),
  };

  const latlngToAddr = () => {
    const updatedLines = [];
    const GEOCODE_URL = new URL("https://api.mapbox.com/");
    const params = {
      access_token:
        "pk.eyJ1IjoiZG91YnRmdWxtciIsImEiOiJjazhnajgwNDAwMjZ1M2dvNHlzcm45dG05In0.h6RGN7zI29MRGGP6H2qwJg",
    };
    const requests = lines.map((line) => {
      const { longitude, latitude } = line;
      GEOCODE_URL.href = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;
      Object.entries(params).forEach(([param, value]) => {
        GEOCODE_URL.searchParams.append(param, value);
      });
      return fetch(GEOCODE_URL)
        .then((res) => res.json())
        .then((result) => {
          updatedLines.push({
            longitude,
            latitude,
            address: result.features[0].place_name,
          });
        })
        .catch((e) => console.log(e));
    });
    Promise.all(requests).then((p) => {
      setLines(updatedLines);
    });
  };

  const addrToLatLng = () => {
    const updatedLines = [];
    const GEOCODE_URL = new URL("https://api.mapbox.com/");
    const params = {
      access_token: mbToken,
    };
    const requests = lines.map((line) => {
      const { address } = line;
      GEOCODE_URL.href = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json`;
      Object.entries(params).forEach(([param, value]) => {
        GEOCODE_URL.searchParams.append(param, value);
      });
      return fetch(GEOCODE_URL)
        .then((res) => res.json())
        .then((result) => {
          updatedLines.push({
            longitude: result.features[0].center[0],
            latitude: result.features[0].center[1],
            address,
          });
        })
        .catch((e) => console.log(e));
    });
    Promise.all(requests).then((p) => {
      setLines(updatedLines);
    });
  };

  const downloadCsv = () => {
    const DATA_FIELDS = ["latitude", "longitude", "address"];
    const headers = DATA_FIELDS.join(",");
    const dataLines = lines.map((line) => {
      let dataLine = "";
      DATA_FIELDS.forEach((field) => {
        const entry =
          typeof line[field] == "string"
            ? line[field].replace(/,/g, " ")
            : line[field];
        console.log("entry:", entry);
        dataLine += `,${entry}`;
      });
      return dataLine.replace(",", "");
    });

    let csvData = headers + "\r\n";
    csvData += dataLines.join("\r\n");
    console.log(csvData);

    let data = "text/csv;charset=utf-8," + csvData;
    const a = document.createElement("a");
    a.href = "data:" + data;
    a.download = "data.csv";
    a.click();
  };

  return (
    <div className="App">
      <Container>
        <h1>Bulk Geocoder</h1>
        <p>Upload a csv file with either: </p>
        <p>latitude, longitude, or the street address(NOT both)</p>
        <p>
          UI Update in progress. <strong>Please do not distribute yet.</strong>{" "}
          need to refresh secret token & hide{" "}
        </p>
        <Input
          type="text"
          placeholder="mapbox access token"
          value={accessKeyInput}
          onChange={(e) => setAccessKeyInput(e.target.value)}
        />
        <Button onClick={() => SetMbToken(accessKeyInput)}>
          Save Access Token
        </Button>
        <CSVReader
          cssClass="ui input primary"
          label=""
          onFileLoaded={handleFileLoaded}
          parserOptions={parseOptions}
        />
        <Button primary onClick={latlngToAddr}>
          latlng -> Add
        </Button>
        <Button secondary onClick={addrToLatLng}>
          Add -> latlng
        </Button>
        <Button onClick={downloadCsv}>Download</Button>
        <Table definition>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Latitude</Table.HeaderCell>
              <Table.HeaderCell>Longitude</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {!lines.length && (
              <Table.Row>
                <Table.Cell></Table.Cell>
                <Table.Cell colSpan="3" textAlign="center">
                  no data yet
                </Table.Cell>
              </Table.Row>
            )}
            {lines.map((line) => (
              <Table.Row>
                <Table.Cell></Table.Cell>
                <Table.Cell>{line.latitude}</Table.Cell>
                <Table.Cell>{line.longitude}</Table.Cell>
                <Table.Cell>{line.address}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  );
}

export default App;
