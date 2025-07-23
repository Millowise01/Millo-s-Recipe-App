// API base URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

// Cache for API responses
const apiCache = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display popular recipes on the home page
    fetchPopularRecipes();
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
    const filterButtons = document.querySelectorAll('.filter-btn');

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
                    // Load West African recipes by default when Countries section is opened
                    if (!countriesSection.hasAttribute('data-loaded')) {
                        fetchAfricanRecipes('West_African');
                        document.getElementById('recipes-btn').click();
                        countriesSection.setAttribute('data-loaded', 'true');
                    }
                    break;
            }
        });
    });

    // Fetch African Recipes with caching
    async function fetchAfricanRecipes(cuisine = '') {
        const url = cuisine ? `${API_BASE_URL}filter.php?a=${cuisine}` : `${API_BASE_URL}filter.php?c=African`;
        const cacheKey = `african_${cuisine}`;
        
        try {
            // Check if we have a valid cache entry
            if (apiCache[cacheKey] && (Date.now() - apiCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
                console.log('Using cached data for:', cacheKey);
                displayRecipes(apiCache[cacheKey].data);
                return;
            }
            
            // Show loading state
            recipesGrid.innerHTML = '<div class="loading-indicator"></div><p>Loading recipes...</p>';
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.meals) {
                // If no meals found for this cuisine, try a fallback search
                recipesGrid.innerHTML = '<p>No specific recipes found. Showing popular recipes instead...</p>';
                const fallbackResponse = await fetch(`${API_BASE_URL}search.php?s=${cuisine || 'African'}`);
                const fallbackData = await fallbackResponse.json();
                
                // Cache the fallback response
                apiCache[cacheKey] = {
                    data: fallbackData.meals,
                    timestamp: Date.now()
                };
                
                displayRecipes(fallbackData.meals);
            } else {
                // Cache the response
                apiCache[cacheKey] = {
                    data: data.meals,
                    timestamp: Date.now()
                };
                
                displayRecipes(data.meals);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipesGrid.innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
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

    // Search Recipes with caching
    async function searchRecipes(query) {
        const cacheKey = `search_${query}`;
        
        try {
            // Check if we have a valid cache entry
            if (apiCache[cacheKey] && (Date.now() - apiCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
                console.log('Using cached search results for:', query);
                displayRecipes(apiCache[cacheKey].data);
                return;
            }
            
            // Show loading state
            recipesGrid.innerHTML = '<div class="loading-indicator"></div><p>Searching recipes...</p>';
            
            const response = await fetch(`${API_BASE_URL}search.php?s=${query}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            apiCache[cacheKey] = {
                data: data.meals,
                timestamp: Date.now()
            };
            
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error searching recipes:', error);
            recipesGrid.innerHTML = `<p>No recipes found: ${error.message}</p>`;
        }
    }

    // Display Recipes with sorting options
    function displayRecipes(meals) {
        recipesGrid.innerHTML = ''; // Clear previous results
        
        if (!meals) {
            recipesGrid.innerHTML = '<p>No recipes found</p>';
            return;
        }
        
        // Add sorting controls
        const sortingControls = document.createElement('div');
        sortingControls.classList.add('sorting-controls');
        sortingControls.innerHTML = `
            <label for="sort-recipes">Sort by: </label>
            <select id="sort-recipes">
                <option value="default">Default</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
            </select>
        `;
        recipesGrid.appendChild(sortingControls);
        
        // Create a container for the recipe cards
        const recipesContainer = document.createElement('div');
        recipesContainer.classList.add('recipes-container');
        recipesGrid.appendChild(recipesContainer);
        
        // Add event listener for sorting
        const sortSelect = document.getElementById('sort-recipes');
        sortSelect.addEventListener('change', () => {
            const sortedMeals = [...meals];
            switch(sortSelect.value) {
                case 'name-asc':
                    sortedMeals.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
                    break;
                case 'name-desc':
                    sortedMeals.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
                    break;
                default:
                    // Keep original order
                    break;
            }
            renderRecipeCards(sortedMeals, recipesContainer);
        });
        
        // Initial render
        renderRecipeCards(meals, recipesContainer);
    }
    
    // Render recipe cards
    function renderRecipeCards(meals, container) {
        container.innerHTML = '';
        meals.forEach(meal => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>${meal.strMeal}</h3>
                <button onclick="fetchMealDetails('${meal.idMeal}')">View Recipe</button>
            `;
            container.appendChild(recipeCard);
        });
    }

    // Fetch Meal Details with caching
    async function fetchMealDetails(mealId) {
        const cacheKey = `meal_${mealId}`;
        
        try {
            // Check if we have a valid cache entry
            if (apiCache[cacheKey] && (Date.now() - apiCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
                console.log('Using cached meal details for:', mealId);
                displayMealDetails(apiCache[cacheKey].data);
                return;
            }
            
            // Create loading modal
            const loadingModal = document.createElement('div');
            loadingModal.classList.add('meal-details-modal');
            loadingModal.innerHTML = `
                <div class="modal-content">
                    <div class="loading-indicator"></div>
                    <p>Loading recipe details...</p>
                </div>
            `;
            document.body.appendChild(loadingModal);
            
            const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Remove loading modal
            document.body.removeChild(loadingModal);
            
            // Cache the response
            apiCache[cacheKey] = {
                data: data.meals[0],
                timestamp: Date.now()
            };
            
            displayMealDetails(data.meals[0]);
        } catch (error) {
            console.error('Error fetching meal details:', error);
            alert(`Failed to load recipe details: ${error.message}`);
            
            // Remove loading modal if it exists
            const loadingModal = document.querySelector('.meal-details-modal');
            if (loadingModal) {
                document.body.removeChild(loadingModal);
            }
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
    
    // Add Enter key support for search
    recipeSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchQuery = recipeSearch.value.trim();
            if (searchQuery) {
                searchRecipes(searchQuery);
            }
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
            
            // Update active state
            countryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Filter Buttons Event Listeners
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            fetchRecipesByCategory(filter);
            document.getElementById('recipes-btn').click();
            
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Fetch Recipes by Category
    async function fetchRecipesByCategory(category) {
        const cacheKey = `category_${category}`;
        
        try {
            // Check if we have a valid cache entry
            if (apiCache[cacheKey] && (Date.now() - apiCache[cacheKey].timestamp) < CACHE_EXPIRATION) {
                console.log('Using cached category data for:', category);
                displayRecipes(apiCache[cacheKey].data);
                return;
            }
            
            // Show loading state
            recipesGrid.innerHTML = '<div class="loading-indicator"></div><p>Loading recipes...</p>';
            
            const response = await fetch(`${API_BASE_URL}filter.php?c=${category}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.meals) {
                // If no meals found for this category, try a fallback search
                recipesGrid.innerHTML = '<p>No recipes found in this category. Showing related recipes instead...</p>';
                const fallbackResponse = await fetch(`${API_BASE_URL}search.php?s=${category}`);
                const fallbackData = await fallbackResponse.json();
                
                // Cache the fallback response
                apiCache[cacheKey] = {
                    data: fallbackData.meals,
                    timestamp: Date.now()
                };
                
                displayRecipes(fallbackData.meals);
            } else {
                // Cache the response
                apiCache[cacheKey] = {
                    data: data.meals,
                    timestamp: Date.now()
                };
                
                displayRecipes(data.meals);
            }
        } catch (error) {
            console.error('Error fetching recipes by category:', error);
            recipesGrid.innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
        }
    };

    // Fetch Popular Recipes for Home Page
    async function fetchPopularRecipes() {
        const popularContainer = document.createElement('div');
        popularContainer.classList.add('popular-recipes');
        popularContainer.innerHTML = '<h2>Popular Recipes</h2><div class="recipes-container" id="popular-recipes-container"><p>Loading popular recipes...</p></div>';
        
        // Add to home section after featured cuisines
        const featuredCuisines = document.querySelector('.featured-cuisines');
        if (featuredCuisines && featuredCuisines.parentNode) {
            featuredCuisines.parentNode.insertBefore(popularContainer, featuredCuisines.nextSibling);
        }
        
        try {
            // Try to get random meals for variety
            const response = await fetch(`${API_BASE_URL}random.php`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                // Get more random meals to have a good selection
                const additionalResponses = await Promise.all([
                    fetch(`${API_BASE_URL}random.php`).then(res => res.json()),
                    fetch(`${API_BASE_URL}random.php`).then(res => res.json()),
                    fetch(`${API_BASE_URL}random.php`).then(res => res.json())
                ]);
                
                const allMeals = [
                    data.meals[0],
                    ...additionalResponses.map(res => res.meals[0])
                ];
                
                const popularContainer = document.getElementById('popular-recipes-container');
                if (popularContainer) {
                    popularContainer.innerHTML = '';
                    allMeals.forEach(meal => {
                        const recipeCard = document.createElement('div');
                        recipeCard.classList.add('recipe-card');
                        recipeCard.innerHTML = `
                            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                            <h3>${meal.strMeal}</h3>
                            <button onclick="fetchMealDetails('${meal.idMeal}')">View Recipe</button>
                        `;
                        popularContainer.appendChild(recipeCard);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching popular recipes:', error);
            const popularContainer = document.getElementById('popular-recipes-container');
            if (popularContainer) {
                popularContainer.innerHTML = '<p>Failed to load popular recipes. Please try again later.</p>';
            }
        }
    }

    // Initial load of African Recipes
    fetchAfricanRecipes();

    // Attach to window for modal functionality
    window.fetchMealDetails = fetchMealDetails;
});