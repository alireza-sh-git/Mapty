'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  static TehranCoords = [35.715298, 51.404343];
  constructor() {
    this._getLocation();
    this._resetForm();
    this._getLocalStorage();
    form.addEventListener('submit', this._submitForm.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._jumpToWorkout.bind(this));
  }

  _getLocation() {
    let coords;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          coords = [position.coords.latitude, position.coords.longitude];
          this._loadMap(coords);
          this.#workouts.forEach(
            function (w) {
              this._renderWorkout(w);
            }.bind(this)
          );
        }.bind(this),
        function () {
          coords = App.TehranCoords;
          this._loadMap(coords).bind(this);
          this.#workouts.forEach(
            function (w) {
              this._renderWorkout(w);
            }.bind(this)
          );
        }.bind(this)
      );
    }
  }

  _loadMap(coords) {
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
  }

  _resetForm() {
    inputType.value = 'running';
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _submitForm(e) {
    e.preventDefault();
    console.log(this.#mapEvent);

    let workout;

    // TODO: Need to add more validation and also make it cleaner
    if (inputDistance.value <= 0) {
      alert('The distance must be a positive value');
      return;
    }
    if (inputDuration.value <= 0) {
      alert('The Duration must be a positive value');
      return;
    }
    if (inputCadence.value <= 0 && inputType.value === 'running') {
      alert('The distance must be a positive value');
      return;
    }
    if (inputElevation.value <= 0 && inputType.value === 'cycling') {
      alert('The distance must be a positive value');
      return;
    }

    if (inputType.value === 'running') {
      workout = new Running(
        [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng],
        Number(inputDistance.value),
        Number(inputDuration.value),
        Number(inputCadence.value)
      );
    } else {
      workout = new Cycling(
        [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng],
        Number(inputDistance.value),
        Number(inputDuration.value),
        Number(inputElevation.value)
      );
    }
    this.#workouts.push(workout);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    this._renderWorkout(workout);

    this._setLocalStorage();
  }
  _renderWorkout(workout) {
    let html;
    if (workout.type === 'running') {
      html = `<li class="workout workout--running" data-id="${workout.id}">
          <h2 class="workout__title">Running on ${
            months[workout.date.getMonth()]
          } ${workout.date.getDay()}</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    } else if (workout.type === 'cycling') {
      html = ` <li class="workout workout--cycling" data-id="${workout.id}">
          <h2 class="workout__title">Cycling on ${
            months[workout.date.getMonth()]
          } ${workout.date.getDay()}</h2>
          <div class="workout__details">
            <span class="workout__icon">🚴‍♀️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    containerWorkouts.insertAdjacentHTML('beforeend', html);
    form.classList.add('hidden');
    var marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type} on ${
          months[workout.date.getMonth()]
        } ${workout.date.getDay()}`
      )
      .openPopup();
  }

  _jumpToWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (workoutEl) {
      const jumpCoords = this.#workouts.find(
        work => work.id === workoutEl.dataset.id
      ).coords;
      this.#map.setView(jumpCoords, this.#mapZoomLevel, {
        animate: true,
        pan: { duration: 1 },
      });
    }
  }

  _getLocalStorage() {
    const data = JSON.parse(
      localStorage.getItem('workouts'),
      function (key, value) {
        if (key === 'date') return new Date(value);
        return value;
      }
    );
    if (!data) return;
    this.#workouts = data;
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
}

class Workout {
  date;
  id;
  coords;
  distance;
  duration;
  type;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.date = new Date();
    this.id = (this.date.getTime() + '').slice(-10);
  }
}

class Running extends Workout {
  cadence;
  pace;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.#calcPace();
    this.type = 'running';
  }
  #calcPace() {
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
}

class Cycling extends Workout {
  elevationGain;
  speed;
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.#calcSpeed();
    this.type = 'cycling';
  }
  #calcSpeed() {
    this.speed = ((this.distance / this.duration) * 60).toFixed(2);
    return this.speed;
  }
}

const app = new App();
