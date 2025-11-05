#!/bin/bash
# REST API Test Script for Bash (Linux/Mac)
# Usage: chmod +x test-api.sh && ./test-api.sh

BASE_URL="http://localhost:3000/api"
TEST_PLAYER_ID=""

echo "========================================"
echo "Liverpool FC API Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Test 1: Get all players
echo -e "${YELLOW}Test 1: GET /api/players${NC}"
echo -e "${GRAY}Getting all players...${NC}"
response=$(curl -s "$BASE_URL/players")
count=$(echo $response | jq '. | length')
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success! Found $count players${NC}"
    if [ $count -gt 0 ]; then
        TEST_PLAYER_ID=$(echo $response | jq -r '.[0]._id')
        name=$(echo $response | jq -r '.[0].name')
        position=$(echo $response | jq -r '.[0].position')
        echo -e "${GRAY}  Sample: $name - $position${NC}"
    fi
else
    echo -e "${RED}✗ Failed${NC}"
fi
echo ""

# Test 2: Search players
echo -e "${YELLOW}Test 2: GET /api/players?search=Salah${NC}"
echo -e "${GRAY}Searching for 'Salah'...${NC}"
response=$(curl -s "$BASE_URL/players?search=Salah")
count=$(echo $response | jq '. | length')
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success! Found $count players matching 'Salah'${NC}"
    echo $response | jq -r '.[].name' | while read name; do
        echo -e "${GRAY}  - $name${NC}"
    done
else
    echo -e "${RED}✗ Failed${NC}"
fi
echo ""

# Test 3: Get player by ID
if [ ! -z "$TEST_PLAYER_ID" ]; then
    echo -e "${YELLOW}Test 3: GET /api/players/:id${NC}"
    echo -e "${GRAY}Getting player with ID: $TEST_PLAYER_ID...${NC}"
    response=$(curl -s "$BASE_URL/players/$TEST_PLAYER_ID")
    name=$(echo $response | jq -r '.name')
    if [ "$name" != "null" ]; then
        echo -e "${GREEN}✓ Success! Retrieved: $name${NC}"
        position=$(echo $response | jq -r '.position')
        squad=$(echo $response | jq -r '.squadNumber')
        apps=$(echo $response | jq -r '.stats.appearances')
        goals=$(echo $response | jq -r '.stats.goals')
        echo -e "${GRAY}  Position: $position${NC}"
        echo -e "${GRAY}  Squad #: $squad${NC}"
        echo -e "${GRAY}  Stats: $apps apps, $goals goals${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    echo ""
fi

# Test 4: Create player
echo -e "${YELLOW}Test 4: POST /api/players${NC}"
echo -e "${GRAY}Creating new test player...${NC}"
timestamp=$(date +%s)
response=$(curl -s -X POST "$BASE_URL/players" \
    -F "name=Test Player $timestamp" \
    -F "position=Midfielder" \
    -F "squadNumber=99" \
    -F "nationality=England" \
    -F "stats[appearances]=1" \
    -F "stats[goals]=0")

NEW_PLAYER_ID=$(echo $response | jq -r '._id')
name=$(echo $response | jq -r '.name')
if [ "$NEW_PLAYER_ID" != "null" ]; then
    echo -e "${GREEN}✓ Success! Created player: $name${NC}"
    echo -e "${GRAY}  ID: $NEW_PLAYER_ID${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi
echo ""

# Test 5: Update player
if [ ! -z "$NEW_PLAYER_ID" ]; then
    echo -e "${YELLOW}Test 5: PUT /api/players/:id${NC}"
    echo -e "${GRAY}Updating test player...${NC}"
    response=$(curl -s -X PUT "$BASE_URL/players/$NEW_PLAYER_ID" \
        -F "stats[goals]=1" \
        -F "stats[assists]=1")
    
    goals=$(echo $response | jq -r '.stats.goals')
    assists=$(echo $response | jq -r '.stats.assists')
    if [ "$goals" != "null" ]; then
        echo -e "${GREEN}✓ Success! Updated player stats${NC}"
        echo -e "${GRAY}  Goals: $goals${NC}"
        echo -e "${GRAY}  Assists: $assists${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    echo ""
fi

# Test 6: Delete player
if [ ! -z "$NEW_PLAYER_ID" ]; then
    echo -e "${YELLOW}Test 6: DELETE /api/players/:id${NC}"
    echo -e "${GRAY}Deleting test player...${NC}"
    response=$(curl -s -X DELETE "$BASE_URL/players/$NEW_PLAYER_ID")
    message=$(echo $response | jq -r '.message')
    if [ "$message" != "null" ]; then
        echo -e "${GREEN}✓ Success! $message${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    echo ""
fi

# Test 7: Filter by position
echo -e "${YELLOW}Test 7: GET /api/players?position=Forward${NC}"
echo -e "${GRAY}Filtering forwards...${NC}"
response=$(curl -s "$BASE_URL/players?position=Forward")
count=$(echo $response | jq '. | length')
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success! Found $count forwards${NC}"
    echo $response | jq -r '.[] | "  - \(.name) (#\(.squadNumber))"' | while read line; do
        echo -e "${GRAY}$line${NC}"
    done
else
    echo -e "${RED}✗ Failed${NC}"
fi
echo ""

# Test 8: Invalid ID (error handling)
echo -e "${YELLOW}Test 8: GET /api/players/invalid-id (Error Handling)${NC}"
echo -e "${GRAY}Testing with invalid ID...${NC}"
response=$(curl -s "$BASE_URL/players/invalid-id")
error=$(echo $response | jq -r '.error')
if [[ "$error" == *"Invalid"* ]]; then
    echo -e "${GREEN}✓ Success! Correctly returned error: $error${NC}"
else
    echo -e "${RED}✗ Unexpected response${NC}"
fi
echo ""

# Summary
echo "========================================"
echo "Test Suite Complete!"
echo "========================================"
echo ""
echo "All REST API endpoints tested:"
echo "  - GET    /api/players"
echo "  - GET    /api/players?search="
echo "  - GET    /api/players?position="
echo "  - GET    /api/players/:id"
echo "  - POST   /api/players"
echo "  - PUT    /api/players/:id"
echo "  - DELETE /api/players/:id"
echo ""
echo "For detailed API documentation, see API_DOCS.md"
