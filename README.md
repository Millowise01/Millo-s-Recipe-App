# Millo's Cuisine Explorer

Millo's Cuisine Explorer is a web application designed to explore and discover recipes from various African and intercontinental cuisines. This project uses HTML, CSS, and JavaScript to create a dynamic and interactive user experience.

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [File Structure](#file-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

- (#license)

## Features

- **Home Section**: Introduction and featured cuisines from Africa and beyond.
- **Recipes Section**: Search and display recipes from different cuisines.
- **Countries Section**: Select recipes based on African regions.
- **Interactive UI**: Navigate between sections, search recipes, and view detailed recipe information.

## Setup

To set up the project locally, follow these steps:

1. **Clone the repository**:
bash
git clone (https://github.com/your-username/millos-cuisine-explorer.git)

2. **Navigate to the project directory**:
bash
cd millos-cuisine-explorer

3. **Open `index.html` in your web browser**:
bash
open index.html

## Usage

### Navigation

- **Home**: Explore featured cuisines.
- **Recipes**: Search for recipes and view a list of recipes from different cuisines.
- **Countries**: Select and view recipes based on different African regions.

### Searching Recipes

1. Go to the Recipes section.
2. Enter a keyword in the search bar and click "Search".
3. View the search results displayed in the grid.

### Viewing Recipe Details

1. Click on a recipe card.
2. A modal will open displaying detailed information about the recipe, including ingredients and instructions.

### index.html

Contains the structure of the web application, including the header, navigation buttons, sections, and footer.

### style.css

Contains styles for the web application, including layout, typography, and interactive elements.

### app.js

Contains JavaScript for dynamic behavior, including navigation logic, fetching and displaying recipes, and handling user interactions.

## API Reference

This project uses [TheMealDB API](https://www.themealdb.com/api.php) to fetch recipe data.

- **Base URL**: `https://www.themealdb.com/api/json/v1/1/`
- **Endpoints**:
  - `filter.php?c=African` - Fetch African recipes.
  - `filter.php?a=West_African` - Fetch West African recipes.
  - `search.php?s=QUERY` - Search recipes by name.
  - `lookup.php?i=ID` - Fetch meal details by ID.
  - `filter.php?c=CATEGORY` - Filter recipes by category (e.g., Vegetarian, Seafood).

## Deployment

This application is deployed on two web servers with a load balancer for high availability and performance.

### Web Servers

The application is deployed on two standard web servers (Web01 and Web02) to ensure redundancy and reliability.

### Load Balancer

A load balancer (Lb01) is configured to distribute incoming traffic between the two web servers, providing:
- Improved performance by distributing the load
- High availability with failover capability
- Scalability for handling increased traffic

For detailed deployment instructions, see [deployment.md](deployment.md).

## License

This project is licensed under the MIT License.
