// API base URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    const homeSection = document.getElementById('home-section');
    const recipesSection = document.getElementById('recipes-section');
    const countriesSection = document.getElementById('countries-section');
    const recipesGrid = document.getElementById('recipes-grid');
    const searchBtn = document.getElementById('search-btn');
    const recipeSearch = document.getElementById('recipe-search');
    const cuisineButtons = document.querySelectorAll('.cuisine-btn');
    const countryButtons = document.querySelectorAll('.country-btn');

    // Navigation logic
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-section'));

            // Add active class to clicked button and corresponding section
            btn.classList.add('active');
            
            switch(btn.id) {
                case 'home-btn':
                    homeSection.classList.add('active-section');
                    break;
                case 'recipes-btn':
                    recipesSection.classList.add('active-section');
                    break;
                case 'countries-btn':
                    countriesSection.classList.add('active-section');
                    break;
            }
        });
    });

    // Fetch African Recipes
    async function fetchAfricanRecipes(cuisine = '') {
        const url = cuisine ? `${API_BASE_URL}filter.php?a=${cuisine}` : `${API_BASE_URL}filter.php?c=African`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error fetching African recipes:', error);
            recipesGrid.innerHTML = '<p>Failed to load recipes</p>';
        }
    }

    // Fetch West African Recipes
    async function fetchWestAfricanRecipes() {
        try {
            const response = await fetch(`${API_BASE_URL}filter.php?a=West_African`);
            const data = await response.json();
            return data.meals;
        } catch (error) {
            console.error('Error fetching recipes:', error);
            return [];
        }
    }

    // Search Recipes
    async function searchRecipes(query) {
        try {
            const response = await fetch(`${API_BASE_URL}search.php?s=${query}`);
            const data = await response.json();
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error searching recipes:', error);
            recipesGrid.innerHTML = '<p>No recipes found</p>';
        }
    }

    // Display Recipes
    function displayRecipes(meals) {
        recipesGrid.innerHTML = ''; // Clear previous results
        
        if (!meals) {
            recipesGrid.innerHTML = '<p>No recipes found</p>';
            return;
        }

        meals.forEach(meal => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>${meal.strMeal}</h3>
                <button onclick="fetchMealDetails('${meal.idMeal}')">View Recipe</button>
            `;
            recipesGrid.appendChild(recipeCard);
        });
    }

    // Fetch Meal Details
    async function fetchMealDetails(mealId) {
        try {
            const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
            const data = await response.json();
            displayMealDetails(data.meals[0]);
        } catch (error) {
            console.error('Error fetching meal details:', error);
        }
    }

    // Display Meal Details
    function displayMealDetails(meal) {
        const detailsModal = document.createElement('div');
        detailsModal.classList.add('meal-details-modal');
        detailsModal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>${meal.strMeal}</h2>
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>Ingredients</h3>
                <ul>
                    ${getIngredientsList(meal)}
                </ul>
                <h3>Instructions</h3>
                <p>${meal.strInstructions}</p>
            </div>
        `;
        
        document.body.appendChild(detailsModal);

        // Close modal functionality
        const closeBtn = detailsModal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(detailsModal);
        });
    }

    // Get Ingredients List
    function getIngredientsList(meal) {
        let ingredients = '';
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients += `<li>${ingredient} - ${measure}</li>`;
            }
        }
        return ingredients;
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const searchQuery = recipeSearch.value.trim();
        if (searchQuery) {
            searchRecipes(searchQuery);
        }
    });

    // Cuisine Buttons Event Listeners
    cuisineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cuisine = btn.getAttribute('data-cuisine');
            fetchAfricanRecipes(cuisine);
            document.getElementById('recipes-btn').click();
        });
    });

    // Country Buttons Event Listeners
    countryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.getAttribute('data-country');
            fetchAfricanRecipes(country);
            document.getElementById('recipes-btn').click();
        });
    });

    // Initial load of African Recipes
    fetchAfricanRecipes();

    // Attach to window for modal functionality
    window.fetchMealDetails = fetchMealDetails;
});