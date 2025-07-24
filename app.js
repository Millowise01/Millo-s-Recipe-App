// API base URL for our backend
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initializeApp();
// Initialize the application
function initializeApp() {
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
    
    // Load popular recipes on home page
    loadPopularRecipes();

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

    // Fetch recipes by area/cuisine
    async function fetchRecipesByArea(area = '') {
        try {
            showLoading(recipesGrid);
            
            let url;
            if (area) {
                url = `${API_BASE_URL}/recipes/area/${encodeURIComponent(area)}`;
            } else {
                url = `${API_BASE_URL}/recipes/african`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch recipes');
            }
            
            if (!data.meals || data.meals.length === 0) {
                recipesGrid.innerHTML = '<p>No recipes found for this area. Try searching for something else.</p>';
                return;
            }
            
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipesGrid.innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
        }
    }

    // Search recipes by name
    async function searchRecipes(query) {
        try {
            showLoading(recipesGrid);
            
            const response = await fetch(`${API_BASE_URL}/recipes/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Search failed');
            }
            
            if (!data.meals || data.meals.length === 0) {
                recipesGrid.innerHTML = '<p>No recipes found. Try a different search term.</p>';
                return;
            }
            
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error searching recipes:', error);
            recipesGrid.innerHTML = `<p>Search failed: ${error.message}</p>`;
        }
    }

    // Fetch recipes by category
    async function fetchRecipesByCategory(category) {
        try {
            showLoading(recipesGrid);
            
            const response = await fetch(`${API_BASE_URL}/recipes/category/${encodeURIComponent(category)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch recipes');
            }
            
            if (!data.meals || data.meals.length === 0) {
                recipesGrid.innerHTML = '<p>No recipes found in this category.</p>';
                return;
            }
            
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error fetching recipes by category:', error);
            recipesGrid.innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
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

    // Fetch meal details by ID
    async function fetchMealDetails(mealId) {
        try {
            // Create loading modal
            const loadingModal = createLoadingModal();
            document.body.appendChild(loadingModal);
            
            const response = await fetch(`${API_BASE_URL}/recipes/details/${mealId}`);
            const data = await response.json();
            
            // Remove loading modal
            document.body.removeChild(loadingModal);
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch recipe details');
            }
            
            displayMealDetails(data.meal);
        } catch (error) {
            console.error('Error fetching meal details:', error);
            
            // Remove loading modal if it exists
            const loadingModal = document.querySelector('.meal-details-modal');
            if (loadingModal) {
                document.body.removeChild(loadingModal);
            }
            
            alert(`Failed to load recipe details: ${error.message}`);
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
            fetchRecipesByArea(cuisine);
            document.getElementById('recipes-btn').click();
        });
    });

    // Country Buttons Event Listeners
    countryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.getAttribute('data-country');
            fetchRecipesByArea(country);
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
    
    // Load popular recipes for home page
    async function loadPopularRecipes() {
        try {
            const response = await fetch(`${API_BASE_URL}/recipes/random?count=4`);
            const data = await response.json();
            
            if (!data.success || !data.meals) {
                console.error('Failed to load popular recipes');
                return;
            }
            
            displayPopularRecipes(data.meals);
        } catch (error) {
            console.error('Error loading popular recipes:', error);
        }
    }
    
    // Display popular recipes on home page
    function displayPopularRecipes(meals) {
        const popularContainer = document.createElement('div');
        popularContainer.classList.add('popular-recipes');
        popularContainer.innerHTML = '<h2>Popular Recipes</h2><div class="recipes-container" id="popular-recipes-container"></div>';
        
        const featuredCuisines = document.querySelector('.featured-cuisines');
        if (featuredCuisines && featuredCuisines.parentNode) {
            featuredCuisines.parentNode.insertBefore(popularContainer, featuredCuisines.nextSibling);
        }
        
        const container = document.getElementById('popular-recipes-container');
        if (container) {
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
    }
    
    // Helper function to show loading indicator
    function showLoading(container) {
        container.innerHTML = '<div class="loading-indicator"></div><p>Loading...</p>';
    }
    
    // Helper function to create loading modal
    function createLoadingModal() {
        const loadingModal = document.createElement('div');
        loadingModal.classList.add('meal-details-modal');
        loadingModal.innerHTML = `
            <div class="modal-content">
                <div class="loading-indicator"></div>
                <p>Loading recipe details...</p>
            </div>
        `;
        return loadingModal;
    }

    // Initial load of African Recipes
    fetchRecipesByArea();
    
    // Close the initialization function
}

// Attach to window for modal functionality
window.fetchMealDetails = fetchMealDetails;
});