#!/bin/bash

echo "Calling API with regex mouse ID..."
echo "=================================="
curl -H "Content-Type: application/json" -X POST -d '{"mouse_id": { "$regex": "NZO" }}' http://127.0.0.1:5000/mice/

echo "Get data for an individual mouse"
echo "=================================="
curl http://127.0.0.1:5000/mouse/NZO-7

echo "Search for expression"
echo "=================================="
curl http://127.0.0.1:5000/search/expression/kit/1/1000

echo "Get expression for all mice"
echo "=================================="
curl http://127.0.0.1:5000/expression/ENSMUSG00000019966

echo "Search for a phenotype"
echo "=================================="
curl http://127.0.0.1:5000/search/phenotype/weight/1/1000

echo "Get a phenotype for all mice"
echo "=================================="
curl http://127.0.0.1:5000/phenotype/sacrifice_data.pancreas_weight_grams
