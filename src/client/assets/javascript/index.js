// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		await getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		await getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		} else if (target.parentElement.matches('.card.track')) {
			handleSelectTrack(target.parentElement)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		} else if (target.parentElement.matches('.card.podracer')) {
			handleSelectPodRacer(target.parentElement)
		}

		// Submit create race form
		if (target.matches('#submit-create-race') || target.parentElement.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	const player_id = store.player_id;
	const track_id = store.track_id;
	if (!store.player_id || !store.track_id) {
		alert('Choose your racer and track')
		return
	}
	try {
		createRace(player_id, track_id).then(res => {
			console.log('response', res)
			const race = res
			store.race_id = race.ID
			renderAt('#race', renderRaceStartView(race.Track))
			return runCountdown()

		})
			.then(() => startRace(store.race_id))
			.then(() => runRace(store.race_id))
			.then(res => renderAt('#race', resultsView(res.positions)))
	} catch (error) {
		console.log(error)
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		const racer = setInterval(() => {
			getRace(raceID)
				.then(res => {
					if (res.status !== 'finished') {
						renderAt('#leaderBoard', raceProgress(res.positions))
					} else {
						clearInterval(racer)
						resolve(res)
					}
				})
		}, 500)

	})
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			setInterval(() => {
				if (timer !== 0) {
					document.getElementById('big-numbers').innerHTML = --timer
				} else {
					clearInterval()
					resolve()
				}
			}, 1000)

		})
	} catch (error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')
	store.player_id = target.id
	// DONE - save the selected racer to the store
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// DONE - save the selected track id to the store
	store.track_id = target.id
}

function handleAccelerate() {
	accelerate(store.race_id)
		.then(() => console.log("accelerate button clicked"))
		.catch(() => console.log('racer not acclerating'))
}

// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}
	return `
		<ul id="racers">
			${racers.map(renderRacerCard).join('')}
		</ul>
	`

}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	} else {

		const results = tracks.map(renderTrackCard).join('')

		return `
		<ul id="tracks">
			${results}
		</ul>
		`
	}
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
	userPlayer.driver_name = "Your car"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	}
}


function getTracks() {
	return fetch(`${SERVER}/api/tracks`, {
		...defaultFetchOpts(),
		method: 'GET',
		dataType: 'jsonp'
	})
		.then(res => res.json())
		.catch(err => console.error('Could not find Tracks', err))
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`, {
		...defaultFetchOpts(),
		method: 'GET',
		dataType: 'jsonp'
	})
		.then(res => res.json())
		.catch(err => console.error('Could not find racers', err))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	const id2 = parseInt(id) - 1
	return fetch(`${SERVER}/api/races/${id2}`, {
		...defaultFetchOpts(),
		method: 'GET',
		dataType: 'jsonp'
	})
		.then(res => res.json())
		.catch(err => console.error('Problem getting race', err))
}

async function startRace(id) {
	const ids = parseInt(id) - 1
	try {
		const data = await
			fetch(`${SERVER}/api/races/${ids}/start`, {
				method: 'POST',
				dataType: 'jsonp',
				...defaultFetchOpts(),
			});
		return data;
	} catch (err) {
		console.log("Problem with getRace request::", err);
	}
}
function accelerate(id) {
	const options = parseInt(id) - 1
	return fetch(`${SERVER}/api/races/${options}/accelerate`, {
		...defaultFetchOpts(),
		method: 'POST'
	})
}

