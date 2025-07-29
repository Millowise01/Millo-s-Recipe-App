// API base URL for our backend
const API_BASE_URL = '/api';
const API_KEY = 'secure-api-key-2024'; // In production, this should be fetched securely

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

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
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-section'));
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

    // Search functionality
    searchBtn.addEventListener('click', () => {
        const query = recipeSearch.value.trim();
        if (query) {
            searchRecipes(query);
        }
    });

    // Enter key support for search
    recipeSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = recipeSearch.value.trim();
            if (query) {
                searchRecipes(query);
            }
        }
    });

    // Cuisine buttons
    cuisineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cuisine = btn.getAttribute('data-cuisine');
            fetchRecipesByArea(cuisine);
            document.getElementById('recipes-btn').click();
        });
    });

    // Country buttons
    countryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.getAttribute('data-country');
            fetchRecipesByArea(country);
            document.getElementById('recipes-btn').click();
            
            countryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            fetchRecipesByCategory(filter);
            document.getElementById('recipes-btn').click();
            
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Initial load of African recipes
    fetchRecipesByArea();
}

// Helper function to make authenticated API requests
async function apiRequest(url, options = {}) {
    const headers = {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    return fetch(url, { ...options, headers });
}

// Load popular recipes for home page
async function loadPopularRecipes() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/recipes/random?count=4`);
        const data = await response.json();
        
        if (data.success && data.meals) {
            displayPopularRecipes(data.meals);
        }
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
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <h3>${meal.strMeal}</h3>
                <button onclick="fetchMealDetails('${meal.idMeal}')">View Recipe</button>
            `;
            container.appendChild(recipeCard);
        });
    }
}

// Fetch recipes by area/cuisine
async function fetchRecipesByArea(area = '') {
    try {
        const recipesGrid = document.getElementById('recipes-grid');
        showLoading(recipesGrid);
        
        let url = area ? 
            `${API_BASE_URL}/recipes/area/${encodeURIComponent(area)}` : 
            `${API_BASE_URL}/recipes/african`;
        
        const response = await apiRequest(url);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch recipes');
        }
        
        if (!data.meals || data.meals.length === 0) {
            recipesGrid.innerHTML = '<p>No recipes found for this area.</p>';
            return;
        }
        
        displayRecipes(data.meals);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        document.getElementById('recipes-grid').innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
    }
}

// Search recipes by name
async function searchRecipes(query) {
    try {
        const recipesGrid = document.getElementById('recipes-grid');
        showLoading(recipesGrid);
        
        const response = await apiRequest(`${API_BASE_URL}/recipes/search?q=${encodeURIComponent(query)}`);
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
        document.getElementById('recipes-grid').innerHTML = `<p>Search failed: ${error.message}</p>`;
    }
}

// Fetch recipes by category
async function fetchRecipesByCategory(category) {
    try {
        const recipesGrid = document.getElementById('recipes-grid');
        showLoading(recipesGrid);
        
        const response = await apiRequest(`${API_BASE_URL}/recipes/category/${encodeURIComponent(category)}`);
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
        document.getElementById('recipes-grid').innerHTML = `<p>Failed to load recipes: ${error.message}</p>`;
    }
}

// Display recipes with sorting options
function displayRecipes(meals) {
    const recipesGrid = document.getElementById('recipes-grid');
    recipesGrid.innerHTML = '';
    
    if (!meals || meals.length === 0) {
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
    
    // Create container for recipe cards
    const recipesContainer = document.createElement('div');
    recipesContainer.classList.add('recipes-container');
    recipesGrid.appendChild(recipesContainer);
    
    // Add sorting event listener
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
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
            <h3>${meal.strMeal}</h3>
            <button onclick="fetchMealDetails('${meal.idMeal}')">View Recipe</button>
        `;
        container.appendChild(recipeCard);
    });
}

// Fetch meal details by ID
async function fetchMealDetails(mealId) {
    try {
        const loadingModal = createLoadingModal();
        document.body.appendChild(loadingModal);
        
        const response = await apiRequest(`${API_BASE_URL}/recipes/details/${mealId}`);
        const data = await response.json();
        
        document.body.removeChild(loadingModal);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch recipe details');
        }
        
        displayMealDetails(data.meal);
    } catch (error) {
        console.error('Error fetching meal details:', error);
        
        const loadingModal = document.querySelector('.meal-details-modal');
        if (loadingModal) {
            document.body.removeChild(loadingModal);
        }
        
        alert(`Failed to load recipe details: ${error.message}`);
    }
}

// Display meal details in modal
function displayMealDetails(meal) {
    const modal = document.createElement('div');
    modal.classList.add('meal-details-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <h2>${meal.strMeal}</h2>
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>Ingredients</h3>
            <ul>${getIngredientsList(meal)}</ul>
            <h3>Instructions</h3>
            <p>${meal.strInstructions}</p>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Get ingredients list from meal object
function getIngredientsList(meal) {
    let ingredients = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== '') {
            ingredients += `<li>${ingredient} - ${measure || ''}</li>`;
        }
    }
    return ingredients;
}

// Helper function to show loading indicator
function showLoading(container) {
    container.innerHTML = '<div class="loading-indicator"></div><p>Loading...</p>';
}

// Helper function to create loading modal
function createLoadingModal() {
    const modal = document.createElement('div');
    modal.classList.add('meal-details-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="loading-indicator"></div>
            <p>Loading recipe details...</p>
        </div>
    `;
    return modal;
}

// Attach to window for global access
window.fetchMealDetails = fetchMealDetails;