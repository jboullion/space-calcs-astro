<template>
	<div id="habitat__app" class="row mb-5" v-cloak>
		<div class="calc-form col-md-4">
			<div class="mb-5 px-2 rounded border">
				<div id="mission" class="habitat__mission form-section active">
					<h5 @click="showLocation = !showLocation">
						<i class="fas" :class="toggleClass(showLocation)"></i>
						Mission
					</h5>
					<div class="calc-toggle" v-show="showLocation">
						<div class="mb-3">
							<label for="location" class="form-label"
								>Location</label
							>
							<select
								class="form-select"
								v-model="formData.mission.location"
								@change="updateMission"
							>
								<option
									v-for="location in locations"
									:value="location"
								>
									{{ location.name }}
								</option>
							</select>
						</div>
						<div
							class="form-check form-switch mb-3"
							v-if="isRegolithAvailable"
						>
							<input
								class="form-check-input"
								type="checkbox"
								id="mission-shielding"
								v-model="formData.mission.shielding"
								:disabled="!isRegolithAvailable"
								@change="updateMission"
							/>
							<label
								class="form-check-label"
								for="mission-shielding"
							>
								Regolith for radiation shielding
							</label>
						</div>
						<div
							class="form-check form-switch mb-3"
							v-if="isRegolithAvailable"
						>
							<input
								class="form-check-input"
								type="checkbox"
								id="mission-growing"
								v-model="formData.mission.growing"
								:disabled="!isRegolithAvailable"
								@change="updateMission"
							/>
							<label
								class="form-check-label"
								for="mission-growing"
							>
								Regolith for biomass growing medium
							</label>
						</div>
						<div
							class="form-check form-switch mb-3"
							v-if="isCO2Available"
						>
							<input
								class="form-check-input"
								type="checkbox"
								id="mission-atmosphere"
								v-model="formData.mission.atmosphere"
								:disabled="!isCO2Available"
								@change="updateMission"
							/>
							<label
								class="form-check-label"
								for="mission-atmosphere"
							>
								Use atmosphere for providing balance carbon
								dioxide?
							</label>
						</div>

						<div class="mb-3">
							<label for="crew-num" class="form-label"
								>Crew Number</label
							>
							<input
								type="number"
								class="form-control"
								id="crew-num"
								v-model.number="formData.mission.crew"
								@change="updateMission"
								min="0"
							/>
						</div>
						<div class="mb-3">
							<label for="duration" class="form-label"
								>Mission Duration</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="duration"
									v-model.number="formData.mission.duration"
									@change="updateMission"
									min="0"
								/>
								<span class="input-group-text">days</span>
							</div>
						</div>
						<div class="mb-3">
							<label for="payload-mass" class="form-label"
								>Payload mass</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="payload-mass"
									v-model.number="formData.mission.mass"
									@change="updateMission"
									min="0"
								/>
								<span class="input-group-text">kg</span>
							</div>
						</div>
						<div class="mb-3">
							<label for="payload-volume" class="form-label"
								>Payload volume</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="payload-volume"
									v-model.number="formData.mission.volume"
									@change="updateMission"
									min="0"
								/>
								<span class="input-group-text"
									>m<sup>3</sup></span
								>
							</div>
						</div>
						<div class="mb-3">
							<label for="payload-power" class="form-label"
								>Payload power consumption</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="payload-power"
									v-model.number="formData.mission.power"
									@change="updateMission"
									min="0"
								/>
								<span class="input-group-text">W</span>
							</div>
						</div>
						<div class="form-check form-switch mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								id="payload-night"
								v-model="formData.mission.night"
								@change="updateMission"
							/>
							<label class="form-check-label" for="payload-night">
								Does the payload run during local night?
							</label>
						</div>
					</div>
				</div>

				<div id="structure" class="habitat__structure form-section">
					<h5 @click="showStructure = !showStructure">
						<i class="fas" :class="toggleClass(showStructure)"></i>
						Structure
					</h5>
					<div class="calc-toggle" v-show="showStructure">
						<div class="mb-3">
							<label for="structure-type" class="form-label"
								>Structure type</label
							>
							<select
								class="form-select"
								id="structure-type"
								v-model="formData.structure.type"
								@change="updateStructure"
							>
								<option
									v-for="structure in structures"
									:value="structure"
								>
									{{ structure.type }}
								</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="structure-volume" class="form-label"
								>Enclosed Pressurized Volume</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="structure-volume"
									v-model.number="formData.structure.volume"
									@change="updateStructure"
									min="0"
								/>
								<span class="input-group-text"
									>m<sup>3</sup></span
								>
							</div>
						</div>
						<div class="mb-3">
							<label for="structure-radiation" class="form-label"
								>Permissible radiation level</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="structure-radiation"
									v-model.number="
										formData.structure.radiation
									"
									@change="updateStructure"
									min="0"
								/>
								<span class="input-group-text">mSv/yr</span>
							</div>
						</div>
						<div class="mb-3">
							<label for="structure-mass" class="form-label"
								>Radiation shielding material</label
							>
							<select
								class="form-select"
								id="structure-mass"
								v-model="formData.structure.shielding"
								@change="updateStructure"
							>
								<option
									v-for="material in materials"
									:value="material"
								>
									{{ material.name }}
								</option>
							</select>
						</div>
					</div>
				</div>

				<div id="support" class="habitat__life-support form-section">
					<h5 @click="showSupport = !showSupport">
						<i class="fas" :class="toggleClass(showSupport)"></i>
						Life support system
					</h5>
					<div class="calc-toggle" v-show="showSupport">
						<div class="mb-3">
							<label for="support-air" class="form-label"
								>Air subsystem options</label
							>
							<select
								class="form-select"
								id="support-air"
								v-model="formData.support.air"
								@change="calcResults"
							>
								<option
									v-for="system in airSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="support-food" class="form-label"
								>Food subsystem options</label
							>
							<select
								class="form-select"
								id="support-food"
								v-model="formData.support.food"
								@change="calcResults"
							>
								<option
									v-for="system in foodSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="support-water" class="form-label"
								>Water subsystem options</label
							>
							<select
								class="form-select"
								id="support-water"
								v-model="formData.support.water"
								@change="calcResults"
							>
								<option
									v-for="system in waterSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="support-eva" class="form-label"
								>EVA options</label
							>
							<select
								class="form-select"
								id="support-eva"
								v-model="formData.support.eva"
								@change="calcResults"
							>
								<option
									v-for="system in evaSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>
						<div class="mb-3">
							<label for="support-eva-hours" class="form-label"
								>EVA-hours per week</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="support-eva-hours"
									v-model.number="formData.support.evaHours"
									step="0.1"
									min="0"
									@change="updateEvaHours"
								/>
								<span class="input-group-text">hrs</span>
							</div>
						</div>
						<div class="mb-3">
							<label for="support-clothing" class="form-label"
								>Clothing options</label
							>
							<select
								class="form-select"
								id="support-clothing"
								v-model="formData.support.clothing"
								@change="calcResults"
							>
								<option
									v-for="clothing in clothingOptions"
									:value="clothing"
								>
									{{ clothing.name }}
								</option>
							</select>
						</div>
					</div>
				</div>

				<div id="biomass" class="habitat__biomass form-section">
					<h5 @click="showBiomass = !showBiomass">
						<i class="fas" :class="toggleClass(showBiomass)"></i>
						Biomass generation system
					</h5>
					<div class="calc-toggle" v-show="showBiomass">
						<div class="mb-3">
							<label for="biomass-lighting" class="form-label"
								>Lighting type</label
							>
							<select
								class="form-select"
								id="biomass-lighting"
								v-model="formData.biomass.lighting"
								@change="calcResults"
							>
								<option
									v-for="system in lightingSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>

						<div class="form-check form-switch mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								id="biomass-inside"
								v-model="formData.biomass.inside"
								@change="calcResults"
							/>
							<label class="form-check-label" for="biomass-inside"
								>Biomass generation inside main
								structure?</label
							>
						</div>

						<div class="form-check form-switch mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								id="biomass-destination"
								v-model="formData.biomass.destination"
								@change="calcResults"
							/>
							<label
								class="form-check-label"
								for="biomass-destination"
								>Growing at destination (not in transit)</label
							>
						</div>

						<div class="form-check form-switch mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								id="biomass-revitalisation"
								v-model="formData.biomass.revitalisation"
								@change="calcResults"
							/>
							<label
								class="form-check-label"
								for="biomass-revitalisation"
								>Use biomass system for air
								revitalisation?</label
							>
						</div>

						<div class="mb-3">
							<label for="biomass-growing" class="form-label"
								>Structure type for growing</label
							>
							<select
								class="form-select"
								id="biomass-lighting"
								v-model="formData.biomass.growing"
								@change="calcResults"
							>
								<option
									v-for="system in growingSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>
					</div>
				</div>

				<div id="electrical" class="habitat__life-support form-section">
					<h5 @click="showElectrical = !showElectrical">
						<i class="fas" :class="toggleClass(showElectrical)"></i>
						Electrical and thermal systems
					</h5>
					<div class="calc-toggle" v-show="showElectrical">
						<div class="mb-3">
							<label for="electrical-primary" class="form-label"
								>Primary power generation</label
							>
							<select
								class="form-select"
								id="electrical-primary"
								v-model="formData.electrical.primary"
								@change="updateElectrical"
							>
								<option
									v-for="system in electricalSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>

						<div class="mb-3">
							<label
								for="electrical-primary-elements"
								class="form-label"
								>Number of primary elements</label
							>
							<input
								type="number"
								class="form-control"
								id="electrical-primary-elements"
								v-model.number="
									formData.electrical.primaryElements
								"
								min="0"
								@change="updateElectrical"
							/>
						</div>

						<div class="mb-3">
							<label for="electrical-secondary" class="form-label"
								>Secondary power generation</label
							>
							<select
								class="form-select"
								id="electrical-secondary"
								v-model="formData.electrical.secondary"
								@change="updateElectrical"
							>
								<option
									v-for="system in electricalSolarSystems"
									:value="system"
								>
									{{ system.name }}
								</option>
							</select>
						</div>

						<div class="mb-3">
							<label for="electrical-batteries" class="form-label"
								>Power storage system, batteries</label
							>
							<select
								class="form-select"
								id="electrical-batteries"
								v-model="formData.electrical.batteries"
								@change="updateElectrical"
							>
								<option
									v-for="battery in batteries"
									:value="battery"
								>
									{{ battery.name }}
								</option>
							</select>
						</div>

						<div class="mb-3">
							<label
								for="electrical-storage-percent"
								class="form-label"
								>Percentage of storage in batteries</label
							>
							<div class="input-group">
								<input
									type="number"
									class="form-control"
									id="electrical-storage-percent"
									v-model.number="formData.electrical.storage"
									@change="updateElectrical"
									min="0"
								/>
								<span class="input-group-text">%</span>
							</div>
						</div>

						<div class="mb-3">
							<label for="electrical-cell" class="form-label"
								>Power storage system, fuel cells</label
							>
							<select
								class="form-select"
								id="electrical-cell"
								v-model="formData.electrical.fuelCell"
								@change="updateElectrical"
							>
								<option v-for="cell in fuelCells" :value="cell">
									{{ cell.name }}
								</option>
							</select>
						</div>

						<!-- <div class="mb-3">
          <label for="electrical-fuelCell-percent" class="form-label">Percentage of storage in fuel cells</label>
          <div class="input-group">
            <input type="number" class="form-control" id="electrical-fuelCell-percent" v-model="formData.electrical.fuelCellStorage">
            <span class="input-group-text">%</span>
          </div>
        </div> -->

						<div class="mb-3">
							<label for="electrical-heat" class="form-label"
								>Heat rejection system type</label
							>
							<select
								class="form-select"
								id="electrical-heat"
								v-model="formData.electrical.heat"
								@change="updateElectrical"
							>
								<option
									v-for="radiator in radiators"
									:value="radiator"
								>
									{{ radiator.name }}
								</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="col-md-8">
			<div class="mb-4">
				<button
					class="btn me-2"
					:class="{
						'btn-outline-primary': currentResultTab !== 'results',
						'btn-primary': currentResultTab === 'results',
					}"
					@click="changeTab('results')"
				>
					All Results
				</button>
				<button
					class="btn"
					:class="{
						'btn-outline-success': currentResultTab !== 'crew',
						'btn-success': currentResultTab === 'crew',
					}"
					@click="changeTab('crew')"
				>
					Crew
				</button>
			</div>
			<div
				id="habitat__results"
				class="results-tab"
				v-show="currentResultTab == 'results'"
			>
				<h3>Results</h3>
				<div class="alert alert-danger mt-3" role="alert" v-if="error">
					{{ error }}
				</div>
				<div class="result-chart">
					<div
						id="totals-chart"
						style="width: 100%; height: 400px"
					></div>
				</div>

				<div class="text-center">
					<button
						id="detailed-results"
						class="btn btn-primary my-4"
						type="button"
						@click="showDetails = !showDetails"
					>
						{{ showDetails ? 'Hide' : 'Show' }} Detailed Results
					</button>
				</div>

				<div id="results-table" class="table-responsive">
					<table class="table border">
						<thead>
							<tr>
								<th></th>
								<th>Mass (kg)</th>
								<th style="min-width: 100px">
									Mass - ISRU (kg)
								</th>
								<th style="min-width: 100px">Max power (W)</th>
								<th>Pressurized volume</th>
							</tr>
						</thead>
						<tbody>
							<tr class="result-totals">
								<th>TOTAL</th>
								<td>{{ formatNumber(results.totals.mass) }}</td>
								<td>
									{{ formatNumber(results.totals.massISRU) }}
								</td>
								<td>
									{{ formatNumber(results.totals.power) }}
								</td>
								<td>
									{{ formatNumber(results.totals.volume) }}
								</td>
							</tr>
						</tbody>
						<tfoot v-show="showDetails">
							<tr
								class="toggleDetails"
								@click="
									showStructureTotals = !showStructureTotals
								"
							>
								<th>+ Structure</th>
								<td>
									{{
										formatNumber(
											results.structure.totals.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.structure.totals.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.structure.totals.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showStructureTotals">
								<th>- Pressure vessel</th>
								<td>
									{{
										formatNumber(
											results.structure.vessel.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.structure.vessel.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>-</td>
							</tr>
							<tr v-show="showStructureTotals">
								<th>- Insulation and MMOD shielding</th>
								<td>
									{{
										formatNumber(
											results.structure.insulation.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.structure.insulation
												.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>-</td>
							</tr>
							<tr v-show="showStructureTotals">
								<th>- Radiation shielding</th>
								<td>
									{{
										formatNumber(
											results.structure.shielding.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.structure.shielding
												.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>-</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>

							<tr>
								<th>Avionics system</th>
								<td>
									{{ formatNumber(results.avionics.mass) }}
								</td>
								<td>
									{{
										formatNumber(results.avionics.massISRU)
									}}
								</td>
								<td>
									{{ formatNumber(results.avionics.power) }}
								</td>
								<td>
									{{ formatNumber(results.avionics.volume) }}
								</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>
							<tr
								class="toggleDetails"
								@click="showEclssTotals = !showEclssTotals"
							>
								<th>+ ECLSS systems</th>
								<td>
									{{
										formatNumber(results.eclss.totals.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.totals.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.totals.power)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.totals.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Air</th>
								<td>
									{{ formatNumber(results.eclss.air.mass) }}
								</td>
								<td>
									{{
										formatNumber(results.eclss.air.massISRU)
									}}
								</td>
								<td>
									{{ formatNumber(results.eclss.air.power) }}
								</td>
								<td>
									{{ formatNumber(results.eclss.air.volume) }}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Food</th>
								<td>
									{{ formatNumber(results.eclss.food.mass) }}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.food.massISRU,
										)
									}}
								</td>
								<td>
									{{ formatNumber(results.eclss.food.power) }}
								</td>
								<td>
									{{
										formatNumber(results.eclss.food.volume)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Thermal</th>
								<td>
									{{
										formatNumber(results.eclss.thermal.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.thermal.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.thermal.power,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.thermal.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Waste</th>
								<td>
									{{ formatNumber(results.eclss.waste.mass) }}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.waste.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.waste.power)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.waste.volume)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Water</th>
								<td>
									{{ formatNumber(results.eclss.water.mass) }}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.water.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.water.power)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.water.volume)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- EVA</th>
								<td>
									{{ formatNumber(results.eclss.eva.mass) }}
								</td>
								<td>
									{{
										formatNumber(results.eclss.eva.massISRU)
									}}
								</td>
								<td>
									{{ formatNumber(results.eclss.eva.power) }}
								</td>
								<td>
									{{ formatNumber(results.eclss.eva.volume) }}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Human factors</th>
								<td>
									{{ formatNumber(results.eclss.human.mass) }}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.human.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.human.power)
									}}
								</td>
								<td>
									{{
										formatNumber(results.eclss.human.volume)
									}}
								</td>
							</tr>
							<tr v-show="showEclssTotals">
								<th>- Biomass</th>
								<td>
									{{
										formatNumber(results.eclss.biomass.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.biomass.massISRU,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.biomass.power,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.eclss.biomass.volume,
										)
									}}
								</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>
							<tr>
								<th>Payload systems</th>
								<td>
									{{ formatNumber(results.payload.mass) }}
								</td>
								<td>
									{{ formatNumber(results.payload.massISRU) }}
								</td>
								<td>
									{{ formatNumber(results.payload.power) }}
								</td>
								<td>
									{{ formatNumber(results.payload.volume) }}
								</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>
							<tr>
								<th>Additional biomass pressure vessel</th>
								<td>
									{{ formatNumber(results.addBiomass.mass) }}
								</td>
								<td>
									{{
										formatNumber(
											results.addBiomass.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>-</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>
							<tr
								class="toggleDetails"
								@click="showPowerTotals = !showPowerTotals"
							>
								<th>+ Power system</th>
								<td>
									{{
										formatNumber(results.power.totals.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.power.totals.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.power.totals.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showPowerTotals">
								<th>- Primary power generation</th>
								<td>
									{{
										formatNumber(results.power.primary.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.power.primary.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.power.primary.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showPowerTotals">
								<th>- Secondary power generation</th>
								<td>
									{{
										formatNumber(
											results.power.secondary.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.power.secondary.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.power.secondary.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showPowerTotals">
								<th>- Battery storage</th>
								<td>
									{{
										formatNumber(results.power.battery.mass)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.power.battery.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.power.battery.volume,
										)
									}}
								</td>
							</tr>
							<tr v-show="showPowerTotals">
								<th>- Regenerative fuel cell storage</th>
								<td>
									{{
										formatNumber(
											results.power.fuelCell.mass,
										)
									}}
								</td>
								<td>
									{{
										formatNumber(
											results.power.fuelCell.massISRU,
										)
									}}
								</td>
								<td>-</td>
								<td>
									{{
										formatNumber(
											results.power.fuelCell.volume,
										)
									}}
								</td>
							</tr>
							<tr>
								<td colspan="5">&nbsp;</td>
							</tr>
							<tr>
								<th>Heat rejection system</th>
								<td>{{ formatNumber(results.heat.mass) }}</td>
								<td>
									{{ formatNumber(results.heat.massISRU) }}
								</td>
								<td>{{ formatNumber(results.heat.power) }}</td>
								<td>{{ formatNumber(results.heat.volume) }}</td>
							</tr>
							<!-- <tr>
        <td colspan="5">&nbsp;</td>
      </tr>
      <tr class="result-totals">
        <th>TOTAL</th>
        <td>{{ formatNumber(results.totals.mass) }}</td>
        <td>{{ formatNumber(results.totals.massISRU) }}</td>
        <td>{{ formatNumber(results.totals.power) }}</td>
        <td>{{ formatNumber(results.totals.volume) }}</td>
      </tr> -->
						</tfoot>
					</table>
				</div>
			</div>

			<div
				id="habitat__crew-commitments"
				class="results-tab"
				v-show="currentResultTab == 'crew'"
			>
				<h3>Crew Commitments</h3>

				<div class="result-chart">
					<div
						id="crew-commitments"
						style="width: 100%; height: 400px"
					></div>
				</div>

				<div class="text-center">
					<button
						id="detailed-results"
						class="btn btn-primary my-4"
						type="button"
						@click="showCrewDetails = !showCrewDetails"
					>
						{{ showCrewDetails ? 'Hide' : 'Show' }} Crew Details
					</button>
				</div>

				<div id="crew-table" class="table-responsive">
					<table class="table">
						<thead>
							<tr>
								<th></th>
								<th>Total mission</th>
								<th colspan="2">Total hours per CM per week</th>
								<th>Factor of total available time</th>
							</tr>
						</thead>
						<tbody>
							<tr class="result-totals">
								<th>TOTAL</th>
								<td>
									{{
										formatNumber(crewResults.totals.mission)
									}}
								</td>
								<td>{{ crewResults.totals.fractionCM }}</td>
								<td>{{ crewResults.totals.hoursCM }}</td>
								<td>{{ crewResults.totals.available }}</td>
							</tr>
						</tbody>
						<tfoot v-show="showCrewDetails">
							<tr>
								<th>Air</th>
								<td>
									{{ formatNumber(crewResults.air.mission) }}
								</td>
								<td>{{ crewResults.air.fractionCM }}</td>
								<td>{{ crewResults.air.hoursCM }}</td>
								<td>{{ crewResults.air.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Food</th>
								<td>
									{{ formatNumber(crewResults.food.mission) }}
								</td>
								<td>{{ crewResults.food.fractionCM }}</td>
								<td>{{ crewResults.food.hoursCM }}</td>
								<td>{{ crewResults.food.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Thermal</th>
								<td>
									{{
										formatNumber(
											crewResults.thermal.mission,
										)
									}}
								</td>
								<td>{{ crewResults.thermal.fractionCM }}</td>
								<td>{{ crewResults.thermal.hoursCM }}</td>
								<td>{{ crewResults.thermal.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Waste</th>
								<td>
									{{
										formatNumber(crewResults.waste.mission)
									}}
								</td>
								<td>{{ crewResults.waste.fractionCM }}</td>
								<td>{{ crewResults.waste.hoursCM }}</td>
								<td>{{ crewResults.waste.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Water</th>
								<td>
									{{
										formatNumber(crewResults.water.mission)
									}}
								</td>
								<td>{{ crewResults.water.fractionCM }}</td>
								<td>{{ crewResults.water.hoursCM }}</td>
								<td>{{ crewResults.water.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>EVA</th>
								<td>
									{{ formatNumber(crewResults.eva.mission) }}
								</td>
								<td>{{ crewResults.eva.fractionCM }}</td>
								<td>{{ crewResults.eva.hoursCM }}</td>
								<td>{{ crewResults.eva.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Human factors</th>
								<td>
									{{
										formatNumber(crewResults.human.mission)
									}}
								</td>
								<td>{{ crewResults.human.fractionCM }}</td>
								<td>{{ crewResults.human.hoursCM }}</td>
								<td>{{ crewResults.human.available }}</td>
							</tr>
							<tr v-show="showCrewDetails">
								<th>Biomass</th>
								<td>
									{{
										formatNumber(
											crewResults.biomass.mission,
										)
									}}
								</td>
								<td>{{ crewResults.biomass.fractionCM }}</td>
								<td>{{ crewResults.biomass.hoursCM }}</td>
								<td>{{ crewResults.biomass.available }}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
// TODO:
// BUGS
// 1. Setting Food subsystem options to salad then salad + carbs then back to salad gives different results than packaged -> salad
import {
	computed,
	nextTick,
	onBeforeMount,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from 'vue';
import {
	results,
	crewResults,
	locations,
	structures,
	materials,
	airSystems,
	foodSystems,
	waterSystems,
	evaSystems,
	clothingOptions,
	lightingSystems,
	growingSystems,
	electricalSystems,
	batteries,
	fuelCells,
	radiators,
} from './constants';
import { formatNumber } from '../utils';

import { GoogleCharts } from 'google-charts';
import { debounce } from '../../../utils/utils';

const showLocation = ref(false);
const showStructure = ref(false);
const showSupport = ref(false);
const showBiomass = ref(false);
const showElectrical = ref(false);
const showDetails = ref(false);
const showStructureTotals = ref(false);
const showEclssTotals = ref(false);
const showPowerTotals = ref(false);
const showCrewDetails = ref(false);
const availableHours = ref(67.2);
const currentResultTab = ref('results');
let error: string = '';

const formData = ref({
	mission: {
		location: locations[0],
		shielding: false,
		growing: false,
		atmosphere: false,
		crew: 12,
		duration: 365,
		mass: 25000,
		volume: 100,
		power: 50000,
		night: true,
	},
	structure: {
		type: structures[0],
		volume: 750,
		radiation: 500,
		shielding: materials[2],
	},
	support: {
		air: airSystems[0],
		food: foodSystems[4],
		water: waterSystems[0],
		eva: evaSystems[2],
		evaHours: 0.1,
		clothing: clothingOptions[1],
	},
	biomass: {
		lighting: lightingSystems[0],
		inside: false,
		destination: false,
		revitalisation: true,
		growing: growingSystems[3],
	},
	electrical: {
		primary: electricalSystems[0],
		primaryElements: 50,
		secondary: electricalSystems[9],
		batteries: batteries[0],
		storage: 100,
		fuelCell: fuelCells[1],
		fuelCellStorage: 0,
		heat: radiators[1],
	},
});

let resultsChartHTML: GoogleCharts.api.visualization.ColumnChart;
let crewChartHTML: GoogleCharts.api.visualization.ColumnChart;

// @ts-ignore
let resizeTimeout: Timer = null;

/**
 *
 *
 * SETUP
 *
 *
 **/
onMounted(() => {
	// Default selected options
	GoogleCharts.load('52', {
		packages: ['corechart'],
	}).then(setupCharts);

	// TODO: Debounce this? this.debounce(() => this.drawCharts(), 100)
	window.addEventListener('resize', drawCharts, { passive: true });

	if (document) {
		const skeletonLoader = document.querySelector('#skeletonLoader');
		if (skeletonLoader) skeletonLoader.remove();
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', drawCharts);
});

function setupCharts() {
	if (!GoogleCharts.api.visualization) return;

	resultsChartHTML = new GoogleCharts.api.visualization.ColumnChart(
		document.getElementById('totals-chart'),
	);

	crewChartHTML = new GoogleCharts.api.visualization.ColumnChart(
		document.getElementById('crew-commitments'),
	);

	calcResults();
	drawCharts();
}

/**
 *
 *
 * COMPUTED
 *
 *
 */

const electricalSolarSystems = computed(() => electricalSystems.slice(9));
const isRegolithAvailable = computed(
	() => formData.value.mission.location.regolith,
);
const isCO2Available = computed(() => formData.value.mission.location.co2);
const loadingFactor = computed(
	() => 0.5 + (0.5 * formData.value.mission.crew) / 6,
);
const CMdays = computed(
	() => formData.value.mission.crew * formData.value.mission.duration,
);

const fluxRatio = computed(() => {
	const crewOxygen = -0.518 * formData.value.mission.crew;
	const crewCO2 = formData.value.mission.crew * 1.037;

	const biomassOxygen =
		((formData.value.support.food.isELS
			? formData.value.support.food.O2Production
			: 0) *
			formData.value.mission.crew) /
		1000;
	const biomassCO2 =
		(-(formData.value.support.food.isELS
			? formData.value.support.food.CO2Uptake
			: 0) *
			formData.value.mission.crew) /
		1000;

	const closureNoIsruOxygen = Math.abs(biomassOxygen / crewOxygen) * 100;
	const closureNoIsruCO2 = Math.abs(biomassCO2 / crewCO2) * 100;

	const closureIsruOxygen = Math.abs(biomassOxygen / crewOxygen) * 100;
	const closureIsruCO2 = Math.max(biomassCO2 / crewCO2, 0.9) * 100;

	const OxygenFlux = Math.abs(
		100 -
			(formData.value.mission.atmosphere
				? closureIsruOxygen
				: closureNoIsruOxygen),
	);
	const CO2Flux = Math.abs(
		100 -
			(formData.value.mission.atmosphere
				? closureIsruCO2
				: closureNoIsruCO2),
	);

	return formData.value.biomass.revitalisation
		? (0.441 * OxygenFlux) / 100 + (0.559 * CO2Flux) / 100
		: 1;
});

const growingEnvironmentArea = computed(
	() => formData.value.support.food.crewArea * formData.value.mission.crew,
);
const biomassNetPerDay = computed(() => {
	const co2Balance = formData.value.mission.crew * 1.037;
	const co2Biomass =
		(-formData.value.support.food.CO2Uptake * formData.value.mission.crew) /
		1000;
	const co2PerDay = (co2Balance + co2Biomass) / 1000;
	return formData.value.mission.atmosphere ? -co2PerDay : 0;
});
const primaryBasePower = computed(() => {
	return formData.value.electrical.primary.kWe * 1000;
});
const secondaryBasePower = computed(() => {
	return formData.value.electrical.secondary.kWe * 1000;
});
const peakElectricalDemand = computed(() => {
	return (
		results.eclss.totals.power +
		IRSUPower.value +
		results.avionics.power +
		formData.value.mission.power
	);
});
const nightElectricalDemand = computed(() => {
	const lifeSupportPower =
		results.eclss.air.power +
		results.eclss.food.power +
		results.eclss.thermal.power +
		results.eclss.waste.power +
		results.eclss.water.power;
	return (
		lifeSupportPower +
		IRSUPower.value +
		results.avionics.power +
		(formData.value.mission.night ? formData.value.mission.power : 0)
	);
});
const dayAveragedDemand = computed(() => {
	return (
		(peakElectricalDemand.value * 2) / 3 +
		(nightElectricalDemand.value * 1) / 3
	);
});
const massOfPrimaryPower = computed(() => {
	return (
		formData.value.electrical.primary.mass *
		formData.value.electrical.primaryElements
	);
});
const massOfSecondaryPower = computed(() => {
	return formData.value.electrical.secondary.mass * numberOfSecondaries.value;
});
const numberOfSecondaries = computed(() => {
	const remainderPower =
		dayAveragedDemand.value -
		primaryBasePower.value * formData.value.electrical.primaryElements;

	return Math.ceil(remainderPower / secondaryBasePower.value);
});
const overnightPowerDeficeit = computed(() => {
	const overnightPowerGeneration =
		primaryBasePower.value *
			formData.value.electrical.primaryElements *
			+formData.value.electrical.primary.overnight +
		secondaryBasePower.value *
			numberOfSecondaries.value *
			+formData.value.electrical.secondary.overnight;

	return Math.max(
		(nightElectricalDemand.value - overnightPowerGeneration) *
			formData.value.mission.location.nightDuration,
		0,
	);
});
const IRSUPower = computed(() => {
	const co2PowerPerKgPerDay = 15.2; // M82
	return biomassNetPerDay.value * co2PowerPerKgPerDay;
});
const thermalLoad = computed(() => {
	const airPower = results.eclss.air.power;
	const foodPower = results.eclss.food.power;
	const wastePower = results.eclss.waste.power;
	const waterPower = results.eclss.water.power;
	const evaPower = results.eclss.eva.power;
	const humanPower = results.eclss.human.power;

	const importedQuantityCooling = formData.value.biomass.lighting.cooling;
	const ISRUQuantityCooling =
		formData.value.biomass.lighting.baseline.cooling;
	const biomassQuantityCooling =
		formData.value.biomass.lighting.biomass.cooling;
	const importsQuantityCooling =
		(formData.value.biomass.lighting.perYear.cooling *
			formData.value.mission.duration) /
		365;

	const totalAtDestinationCooling =
		importedQuantityCooling +
		ISRUQuantityCooling +
		biomassQuantityCooling +
		importsQuantityCooling;

	const coolingAtDestination =
		growingEnvironmentArea.value * totalAtDestinationCooling * 1000;

	return (
		(airPower +
			foodPower +
			wastePower +
			waterPower +
			evaPower +
			humanPower +
			coolingAtDestination +
			formData.value.mission.power +
			results.avionics.power +
			IRSUPower.value) *
		(15 / 14)
	);
});
const totalAtDestinationMass = computed(() => {
	const importedQuantityMass = formData.value.biomass.lighting.mass;
	const ISRUQuantity = formData.value.biomass.lighting.baseline.mass;
	const biomassQuantity = formData.value.biomass.lighting.biomass.mass;
	const importsQuantity =
		(formData.value.biomass.lighting.perYear.mass *
			formData.value.mission.duration) /
		365;

	return (
		importedQuantityMass + ISRUQuantity + biomassQuantity + importsQuantity
	);
});
const totalAtDestinationPower = computed(() => {
	const importedQuantityPower = formData.value.biomass.lighting.power;
	const ISRUQuantityPower = formData.value.biomass.lighting.baseline.power;
	const biomassQuantityPower = formData.value.biomass.lighting.biomass.power;
	const importsQuantityPower =
		(formData.value.biomass.lighting.perYear.power *
			formData.value.mission.duration) /
		365;

	return (
		importedQuantityPower +
		ISRUQuantityPower +
		biomassQuantityPower +
		importsQuantityPower
	);
});
const totalAtDestinationVolume = computed(() => {
	const importedQuantityVolume = formData.value.biomass.lighting.volume;
	const ISRUQuantityVolume = formData.value.biomass.lighting.baseline.volume;
	const biomassQuantityVolume =
		formData.value.biomass.lighting.biomass.volume;
	const importsQuantityVolume =
		(formData.value.biomass.lighting.perYear.volume *
			formData.value.mission.duration) /
		365;

	return (
		importedQuantityVolume +
		ISRUQuantityVolume +
		biomassQuantityVolume +
		importsQuantityVolume
	);
});
// ? NOTE: Do we want to have computed "selected" or just refer directly to the formData? Extra code, but easier to read maybe?
const selectedLocation = computed(() => {
	return formData.value.mission.location;
});
const selectedStructure = computed(() => {
	return formData.value.structure.type;
});
const selectedShielding = computed(() => {
	return formData.value.structure.shielding;
});

/**
 *
 *
 * METHODS
 *
 *
 */
function toggleClass(on: boolean) {
	return on ? 'fa-toggle-on' : 'fa-toggle-off';
}
function changeTab(tab: string) {
	currentResultTab.value = tab;

	if (GoogleCharts.api?.visualization) {
		nextTick(drawCharts);
	}
}
function calcStructureTotals() {
	results.structure.vessel.mass = Math.ceil(
		selectedStructure.value.minMass * formData.value.structure.volume,
	);
	results.structure.vessel.massISRU = results.structure.vessel.mass;

	results.structure.insulation.mass = Math.ceil(
		selectedStructure.value.mmodMass * formData.value.structure.volume,
	);
	results.structure.insulation.massISRU = results.structure.insulation.mass;

	results.structure.shielding.mass = Math.ceil(calcRadiationShieldingMass());
	results.structure.shielding.massISRU = results.structure.shielding.mass;

	results.structure.totals.mass =
		results.structure.vessel.mass +
		results.structure.insulation.mass +
		results.structure.shielding.mass;
	results.structure.totals.massISRU =
		results.structure.vessel.massISRU +
		results.structure.insulation.massISRU +
		results.structure.shielding.massISRU;
	results.structure.totals.volume = -formData.value.structure.volume; // Since we are ADDING structure, this is actually a negative value
}
function calcRadiationShieldingMass() {
	const radFactor = selectedLocation.value.mSv / selectedShielding.value.mass;
	const numHalfMasses = Math.max(0, Math.log(radFactor)); // ,2
	const g_cm2Required = numHalfMasses * selectedShielding.value.mass;
	const effectiveRadius = Math.pow(
		(formData.value.structure.volume * 3) / (4 * Math.PI),
		0.33333,
	);
	const effectiveSurfaceArea = 4 * Math.PI * Math.pow(effectiveRadius, 2);
	const exposedSurfaceArea = isRegolithAvailable.value
		? effectiveSurfaceArea / 2
		: effectiveSurfaceArea;

	return g_cm2Required * 10 * exposedSurfaceArea;
}
function calcAvionicsTotals() {
	const baselineMass = 395; // magic fitting function value
	const baselinePower = 864; // magic fitting function value
	const baselineVolume = 1; // ? Do we want to keep this? Will this ever NOT be 1?

	results.avionics.mass = Math.ceil(baselineMass * loadingFactor.value);
	results.avionics.massISRU = results.avionics.mass;
	results.avionics.power = Math.ceil(baselinePower * loadingFactor.value);
	results.avionics.volume = roundTwo(baselineVolume * loadingFactor.value);
}
function calcECLSSAir() {
	const perDayQuantityMass =
		formData.value.support.air.mass * CMdays.value * fluxRatio.value;
	const baselineQuantityMass =
		formData.value.support.air.baseline.mass *
		loadingFactor.value *
		fluxRatio.value;

	results.eclss.air.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.air.massISRU = results.eclss.air.mass;

	const perDayQuantityPower =
		formData.value.support.air.power * CMdays.value * fluxRatio.value;
	const baselineQuantityPower =
		formData.value.support.air.baseline.power *
		loadingFactor.value *
		fluxRatio.value;

	results.eclss.air.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const perDayQuantityVolume =
		formData.value.support.air.volume * CMdays.value * fluxRatio.value +
		0.25; // 0.25 is an attempt to help JS round better
	const baselineQuantityVolume =
		formData.value.support.air.baseline.volume *
		loadingFactor.value *
		fluxRatio.value;

	results.eclss.air.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const perDayQuantityCrewtime =
		formData.value.support.air.crewtime * CMdays.value * fluxRatio.value;
	const baselineQuantityCrewtime =
		formData.value.support.air.baseline.crewtime *
		loadingFactor.value *
		fluxRatio.value;

	crewResults.air.mission = roundTwo(
		perDayQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.air.fractionCM = round(
		(crewResults.air.mission / CMdays.value) * 7,
		3,
	);
	crewResults.air.hoursCM = timeConvert(crewResults.air.fractionCM);
	crewResults.air.available =
		roundTwo((crewResults.air.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcECLSSFood() {
	const perDayQuantityMass = formData.value.support.food.mass * CMdays.value;
	const baselineQuantityMass =
		formData.value.support.food.baseline.mass * loadingFactor.value;

	results.eclss.food.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.food.massISRU = results.eclss.food.mass;

	const perDayQuantityPower =
		formData.value.support.food.power * CMdays.value;
	const baselineQuantityPower =
		formData.value.support.food.baseline.power * loadingFactor.value;

	results.eclss.food.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const perDayQuantityVolume =
		formData.value.support.food.volume * CMdays.value;
	const baselineQuantityVolume =
		formData.value.support.food.baseline.volume * loadingFactor.value;

	results.eclss.food.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const perDayQuantityCrewtime =
		formData.value.support.food.crewtime * CMdays.value;
	const baselineQuantityCrewtime =
		formData.value.support.food.baseline.crewtime * loadingFactor.value;

	crewResults.food.mission = roundTwo(
		perDayQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.food.fractionCM = round(
		(crewResults.food.mission / CMdays.value) * 7,
		3,
	);
	crewResults.food.hoursCM = timeConvert(crewResults.food.fractionCM);
	crewResults.food.available =
		roundTwo((crewResults.food.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcECLSSWaste() {
	const wasteMass = 0.1772606991; // magic fitting function
	const baselineMass = 21.72381579; // magic fitting function

	const perDayQuantityMass = wasteMass * CMdays.value;
	const baselineQuantityMass = baselineMass * loadingFactor.value;

	results.eclss.waste.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.waste.massISRU = results.eclss.waste.mass;

	const wastePower = 0; // magic fitting function
	const baselinePower = 14; // magic fitting function

	const perDayQuantityPower = wastePower * CMdays.value;
	const baselineQuantityPower = baselinePower * loadingFactor.value;

	results.eclss.waste.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const wasteVolume = 0.004923810473; // magic fitting function
	const baselineVolume = -0.2791447368; // magic fitting function

	const perDayQuantityVolume = wasteVolume * CMdays.value;
	const baselineQuantityVolume = baselineVolume * loadingFactor.value;

	results.eclss.waste.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const wasteCrewtime = 0; // magic fitting function
	const baselineCrewtime = 0; // magic fitting function

	const perDayQuantityCrewtime = wasteCrewtime * CMdays.value;
	const baselineQuantityCrewtime = baselineCrewtime * loadingFactor.value;

	crewResults.waste.mission = roundTwo(
		perDayQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.waste.fractionCM = round(
		(crewResults.waste.mission / CMdays.value) * 7,
		3,
	);
	crewResults.waste.hoursCM = timeConvert(crewResults.waste.fractionCM);
	crewResults.waste.available =
		roundTwo((crewResults.waste.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcECLSSWater() {
	const baseWaterUsage = 9.661; // standard mass of water per person per day
	const laundryUse = formData.value.support.clothing.waterUsage;
	const cropUse = formData.value.support.food.waterUsage + 0.01; // 0.01 is an attempt to help JS return a better value.

	const durationWaterUse =
		(baseWaterUsage + laundryUse + cropUse) * CMdays.value;

	const dailyWaterUse =
		(baseWaterUsage + laundryUse + cropUse) * formData.value.mission.crew;
	const normalizedWaterUse = 0.5 * (1 + dailyWaterUse / 40);

	const perDayQuantityMass =
		formData.value.support.water.mass * durationWaterUse;
	const baselineQuantityMass =
		formData.value.support.water.baseline.mass * normalizedWaterUse;

	results.eclss.water.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.water.massISRU = results.eclss.water.mass;

	const perDayQuantityPower =
		formData.value.support.water.power * durationWaterUse;
	const baselineQuantityPower =
		formData.value.support.water.baseline.power * normalizedWaterUse;

	results.eclss.water.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const perDayQuantityVolume =
		formData.value.support.water.volume * durationWaterUse;
	const baselineQuantityVolume =
		formData.value.support.water.baseline.volume * normalizedWaterUse;

	results.eclss.water.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const perDayQuantityCrewtime =
		formData.value.support.water.crewtime * CMdays.value;
	const baselineQuantityCrewtime =
		formData.value.support.water.baseline.crewtime * loadingFactor.value;

	crewResults.water.mission = roundTwo(
		perDayQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.water.fractionCM = round(
		(crewResults.water.mission / CMdays.value) * 7,
		3,
	);
	crewResults.water.hoursCM = timeConvert(crewResults.water.fractionCM);
	crewResults.water.available =
		roundTwo((crewResults.water.fractionCM / availableHours.value) * 100) +
		'%';
}

function calcECLSSeva() {
	const totalEVAs =
		formData.value.support.evaHours * (formData.value.mission.duration / 7);

	const perDayQuantityMass = formData.value.support.eva.mass * totalEVAs;
	const baselineQuantityMass =
		formData.value.support.eva.baseline.mass * loadingFactor.value;

	results.eclss.eva.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.eva.massISRU = results.eclss.eva.mass;

	const perDayQuantityPower = formData.value.support.eva.power * totalEVAs;
	const baselineQuantityPower =
		formData.value.support.eva.baseline.power * loadingFactor.value;

	results.eclss.eva.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const perDayQuantityVolume = formData.value.support.eva.volume * totalEVAs;
	const baselineQuantityVolume =
		formData.value.support.eva.baseline.volume * loadingFactor.value;

	results.eclss.eva.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const perDayQuantityCrewtime =
		formData.value.support.eva.crewtime * totalEVAs;
	const baselineQuantityCrewtime =
		formData.value.support.eva.baseline.crewtime * loadingFactor.value;

	crewResults.eva.mission = roundTwo(
		perDayQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.eva.fractionCM = round(
		(crewResults.eva.mission / CMdays.value) * 7,
		3,
	);
	crewResults.eva.hoursCM = timeConvert(crewResults.eva.fractionCM);
	crewResults.eva.available =
		roundTwo((crewResults.eva.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcECLSSClothing() {
	const perDayQuantityMass =
		formData.value.support.clothing.mass * CMdays.value;
	const baselineQuantityMass =
		formData.value.support.clothing.baseline.mass * loadingFactor.value;

	results.eclss.clothing.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.clothing.massISRU = results.eclss.clothing.mass;

	const perDayQuantityPower =
		formData.value.support.clothing.power * CMdays.value;
	const baselineQuantityPower =
		formData.value.support.clothing.baseline.power * loadingFactor.value;

	results.eclss.clothing.power = Math.ceil(
		perDayQuantityPower + baselineQuantityPower,
	);

	const perDayQuantityVolume =
		formData.value.support.clothing.volume * CMdays.value;
	const baselineQuantityVolume =
		formData.value.support.clothing.baseline.volume * loadingFactor.value;

	results.eclss.clothing.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	const perDayQuantityCrewtime =
		formData.value.support.clothing.crewtime * CMdays.value;
	const baselineQuantityCrewtime =
		formData.value.support.clothing.baseline.crewtime * loadingFactor.value;

	results.eclss.clothing.crewtime =
		perDayQuantityCrewtime + baselineQuantityCrewtime;
}
function calcECLSSMisc() {
	const miscMass = 0.3300297382; // magic fitting function
	const baselineMass = 0; // magic fitting function

	const perDayQuantityMass = miscMass * CMdays.value;
	const baselineQuantityMass = baselineMass * loadingFactor.value;

	results.eclss.misc.mass = Math.ceil(
		perDayQuantityMass + baselineQuantityMass,
	);
	results.eclss.misc.massISRU = results.eclss.misc.mass;

	results.eclss.misc.power = 0;

	const miscVolume = 0.0003306751728; // magic fitting function
	const baselineVolume = 0; // magic fitting function

	const perDayQuantityVolume = miscVolume * CMdays.value;
	const baselineQuantityVolume = baselineVolume * loadingFactor.value;

	results.eclss.misc.volume = roundTwo(
		perDayQuantityVolume + baselineQuantityVolume,
	);

	const miscCrewtime = 0; // magic fitting function
	const baselineCrewtime = 0; // magic fitting function

	const perDayQuantityCrewtime = miscCrewtime * CMdays.value;
	const baselineQuantityCrewtime = baselineCrewtime * loadingFactor.value;

	results.eclss.misc.crewtime =
		perDayQuantityCrewtime + baselineQuantityCrewtime;
}
function calcECLSSHumanFactors() {
	results.eclss.human.mass =
		results.eclss.clothing.mass + results.eclss.misc.mass;
	results.eclss.human.massISRU = results.eclss.human.mass;

	results.eclss.human.power =
		results.eclss.clothing.power + results.eclss.misc.power;

	results.eclss.human.volume =
		results.eclss.clothing.volume + results.eclss.misc.volume;

	// Crewtime
	crewResults.human.mission = roundTwo(
		results.eclss.clothing.crewtime + results.eclss.misc.crewtime,
	);
	crewResults.human.fractionCM = round(
		(crewResults.human.mission / CMdays.value) * 7,
		3,
	);
	crewResults.human.hoursCM = timeConvert(crewResults.human.fractionCM);
	crewResults.human.available =
		roundTwo((crewResults.human.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcECLSSBiomass() {
	const interiorMass =
		totalAtDestinationMass.value * growingEnvironmentArea.value;

	results.eclss.biomass.mass = Math.ceil(interiorMass);
	results.eclss.biomass.massISRU = results.eclss.biomass.mass;

	results.eclss.biomass.power = Math.ceil(
		totalAtDestinationPower.value * 1000 * growingEnvironmentArea.value,
	);

	results.eclss.biomass.volume = roundTwo(
		totalAtDestinationVolume.value * growingEnvironmentArea.value,
	);

	// Crewtime
	const importedQuantityCrewtime = formData.value.biomass.lighting.crewtime;
	const ISRUQuantityCrewtime =
		formData.value.biomass.lighting.baseline.crewtime;
	const biomassQuantityCrewtime =
		formData.value.biomass.lighting.biomass.crewtime;
	const importsQuantityCrewtime =
		(formData.value.biomass.lighting.perYear.crewtime *
			formData.value.mission.duration) /
		365;

	const totalAtDestinationCrewtime =
		importedQuantityCrewtime +
		ISRUQuantityCrewtime +
		biomassQuantityCrewtime +
		importsQuantityCrewtime;

	crewResults.biomass.mission = roundTwo(
		totalAtDestinationCrewtime * growingEnvironmentArea.value,
	);
	crewResults.biomass.fractionCM = round(
		(crewResults.biomass.mission / CMdays.value) * 7,
		3,
	);
	crewResults.biomass.hoursCM = timeConvert(crewResults.biomass.fractionCM);
	crewResults.biomass.available =
		roundTwo(
			(crewResults.biomass.fractionCM / availableHours.value) * 100,
		) + '%';
}
function calcECLSSThermal() {
	const thermalBaselineMass = 0.006728978772;

	const perkWeQuantityMass = thermalBaselineMass * thermalLoad.value;
	const baselineQuantityMass = 239.3400139; // magic fitting function

	results.eclss.thermal.mass = Math.ceil(
		perkWeQuantityMass + baselineQuantityMass,
	);
	results.eclss.thermal.massISRU = results.eclss.thermal.mass;

	const thermalBaselinePower = 0.01600254148;

	const perkWeQuantityPower = thermalBaselinePower * thermalLoad.value;
	const baselineQuantityPower = 682.9121604;

	results.eclss.thermal.power = Math.ceil(
		perkWeQuantityPower + baselineQuantityPower,
	);

	const thermalBaselineVolume = 0.0000207563013;

	const perkWeQuantityVolume = thermalBaselineVolume * thermalLoad.value;
	const baselineQuantityVolume = 0.7350206333;

	results.eclss.thermal.volume = roundTwo(
		perkWeQuantityVolume + baselineQuantityVolume,
	);

	// Crewtime
	const perkWeQuantityCrewtime = 0.0002286352841 * thermalLoad.value;
	const baselineQuantityCrewtime = -1.360854009;

	crewResults.thermal.mission = roundTwo(
		perkWeQuantityCrewtime + baselineQuantityCrewtime,
	);
	crewResults.thermal.fractionCM = round(
		(crewResults.thermal.mission / CMdays.value) * 7,
		3,
	);
	crewResults.thermal.hoursCM = timeConvert(crewResults.thermal.fractionCM);
	crewResults.thermal.available =
		roundTwo(
			(crewResults.thermal.fractionCM / availableHours.value) * 100,
		) + '%';
}
function calcECLSSTotals() {
	calcECLSSAir();
	calcECLSSFood();
	calcECLSSWaste();
	calcECLSSWater();
	calcECLSSeva();
	calcECLSSClothing();
	calcECLSSMisc();
	calcECLSSHumanFactors();
	calcECLSSBiomass();
	calcECLSSThermal();

	results.eclss.totals.mass =
		results.eclss.air.mass +
		results.eclss.food.mass +
		results.eclss.waste.mass +
		results.eclss.water.mass +
		results.eclss.eva.mass +
		results.eclss.human.mass +
		results.eclss.biomass.mass +
		results.eclss.thermal.mass;
	results.eclss.totals.massISRU =
		results.eclss.air.massISRU +
		results.eclss.food.massISRU +
		results.eclss.waste.massISRU +
		results.eclss.water.massISRU +
		results.eclss.eva.massISRU +
		results.eclss.human.massISRU +
		results.eclss.biomass.massISRU +
		results.eclss.thermal.massISRU;
	results.eclss.totals.power =
		results.eclss.air.power +
		results.eclss.food.power +
		results.eclss.waste.power +
		results.eclss.water.power +
		results.eclss.eva.power +
		results.eclss.human.power +
		results.eclss.biomass.power +
		results.eclss.thermal.power;

	const totalECLSSVolume =
		results.eclss.air.volume +
		results.eclss.food.volume +
		results.eclss.waste.volume +
		results.eclss.water.volume +
		results.eclss.eva.volume +
		results.eclss.human.volume +
		results.eclss.thermal.volume; // + results.eclss.biomass.volume

	results.eclss.totals.volume =
		totalECLSSVolume +
		(formData.value.biomass.inside ? results.eclss.biomass.volume : 0);

	crewResults.totals.mission = roundTwo(
		crewResults.air.mission +
			crewResults.food.mission +
			crewResults.water.mission +
			crewResults.waste.mission +
			crewResults.thermal.mission +
			crewResults.eva.mission +
			crewResults.human.mission +
			crewResults.biomass.mission,
	);
	// TODO: create function to update crewtime objects with last three properties
	crewResults.totals.fractionCM = round(
		(crewResults.totals.mission / CMdays.value) * 7,
		3,
	);
	crewResults.totals.hoursCM = timeConvert(crewResults.totals.fractionCM);
	crewResults.totals.available =
		roundTwo((crewResults.totals.fractionCM / availableHours.value) * 100) +
		'%';
}
function calcPayloadTotals() {
	results.payload.mass = formData.value.mission.mass;

	results.payload.massISRU = results.payload.mass;

	results.payload.power = formData.value.mission.power;

	results.payload.volume = formData.value.mission.volume;
}
function calcAddBiomassVessel() {
	const volumeEquivalent = formData.value.biomass.inside
		? 0
		: formData.value.biomass.growing.mass;

	const requiredVolume =
		totalAtDestinationVolume.value * growingEnvironmentArea.value;

	const structureMass = requiredVolume * volumeEquivalent;

	results.addBiomass.mass = Math.ceil(structureMass);
	results.addBiomass.massISRU = results.addBiomass.mass;
}
function calcPowerPrimary() {
	const fractionOfMissionLife =
		formData.value.mission.duration /
		(formData.value.electrical.primary.life_yr * 365);

	results.power.primary.mass = Math.ceil(
		massOfPrimaryPower.value * (1 + fractionOfMissionLife),
	);
	results.power.primary.massISRU = results.power.primary.mass;
	results.power.primary.power = 0;
	results.power.primary.volume = 0;
}
function calcPowerSecondary() {
	const fractionOfMissionLife =
		formData.value.mission.duration /
		(formData.value.electrical.secondary.life_yr * 365);

	results.power.secondary.mass = Math.ceil(
		massOfSecondaryPower.value * (1 + fractionOfMissionLife),
	);
	results.power.secondary.massISRU = results.power.secondary.mass;
	results.power.secondary.power = 0;
	results.power.secondary.volume = 0;
}
function calcPowerBattery() {
	const effectiveEnergyDensityPerKg =
		formData.value.electrical.batteries.WhKg *
		(formData.value.electrical.batteries.discharge / 100);
	const effectiveEnergyDensityPerWhL =
		formData.value.electrical.batteries.WhL *
		(formData.value.electrical.batteries.discharge / 100);
	const energyStorageInBatteries =
		(overnightPowerDeficeit.value * formData.value.electrical.storage) /
		100;

	const massOfBatteriesRequired =
		energyStorageInBatteries / effectiveEnergyDensityPerKg;
	const volumeOfBatteries =
		energyStorageInBatteries / effectiveEnergyDensityPerWhL;
	const fractionOfBatteryLifeOnMission =
		(formData.value.mission.duration *
			formData.value.mission.location.batteryCyclesPerDay) /
		formData.value.electrical.batteries.cycles;

	const massIncludingResupply =
		massOfBatteriesRequired * (1 + fractionOfBatteryLifeOnMission);
	const volumeIncludingResupply =
		volumeOfBatteries * (1 + fractionOfBatteryLifeOnMission);

	results.power.battery.mass =
		overnightPowerDeficeit.value === 0
			? 0
			: Math.ceil(massIncludingResupply);
	results.power.battery.massISRU = results.power.battery.mass;
	results.power.battery.power = 0;

	results.power.battery.volume =
		overnightPowerDeficeit.value === 0
			? 0
			: roundTwo(volumeIncludingResupply / 1000);
}
function calcPowerFuelCell() {
	const fuelCellStorage = 100 - formData.value.electrical.storage;

	const powerOutputOfFuelCells =
		fuelCellStorage != 0 ? nightElectricalDemand.value : 0;
	const energyStorageInFuelCells =
		(overnightPowerDeficeit.value * fuelCellStorage) / 100;

	const massOfFuelCellsRequired =
		powerOutputOfFuelCells / formData.value.electrical.fuelCell.Wkg;
	const massOfStorageRequired =
		energyStorageInFuelCells / formData.value.electrical.fuelCell.WhKg;

	results.power.fuelCell.mass = Math.ceil(
		overnightPowerDeficeit.value === 0
			? 0
			: massOfFuelCellsRequired + massOfStorageRequired,
	);
	results.power.fuelCell.massISRU = results.power.fuelCell.mass;
	results.power.fuelCell.power = 0;

	const volumeOfStorage =
		energyStorageInFuelCells / formData.value.electrical.fuelCell.WhL;

	results.power.fuelCell.volume = roundTwo(
		overnightPowerDeficeit.value === 0 ? 0 : volumeOfStorage / 1000,
	);
}
function calcPowerSystems() {
	calcPowerPrimary();
	calcPowerSecondary();
	calcPowerBattery();
	calcPowerFuelCell();

	const totalPowerMass =
		results.power.primary.mass + results.power.secondary.mass;
	const totalStorageMass =
		results.power.battery.mass + results.power.fuelCell.mass;

	results.power.totals.mass = totalPowerMass + totalStorageMass;
	results.power.totals.massISRU = results.power.totals.mass;
	results.power.totals.power = 0;
	results.power.totals.volume =
		results.power.battery.volume + results.power.fuelCell.volume;
}
function calcHeatRejectionSystem() {
	const heatRejectionFromHabitat =
		thermalLoad.value / 1000 + results.avionics.power / 1000;

	results.heat.mass = Math.ceil(
		heatRejectionFromHabitat * formData.value.electrical.heat.kgPerkWt,
	);
	results.heat.massISRU = results.heat.mass;
	results.heat.power = 0;
	results.heat.volume = 0;
}
function calcFinalTotals() {
	results.totals.mass =
		results.structure.totals.mass +
		results.avionics.mass +
		results.eclss.totals.mass +
		results.payload.mass +
		results.addBiomass.mass +
		results.power.totals.mass +
		results.heat.mass;
	results.totals.massISRU =
		results.structure.totals.massISRU +
		results.avionics.massISRU +
		results.eclss.totals.massISRU +
		results.payload.massISRU +
		results.addBiomass.massISRU +
		results.power.totals.massISRU +
		results.heat.massISRU;
	results.totals.power =
		results.structure.totals.power +
		results.avionics.power +
		results.eclss.totals.power +
		results.payload.power +
		results.addBiomass.power +
		results.power.totals.power +
		results.heat.power;
	results.totals.volume =
		results.avionics.volume +
		results.eclss.totals.volume +
		results.payload.volume +
		results.addBiomass.volume +
		results.power.totals.volume +
		results.heat.volume;
}
function calcResults() {
	calcStructureTotals();
	calcAvionicsTotals();
	calcECLSSTotals();
	calcPayloadTotals();
	calcAddBiomassVessel();
	calcPowerSystems();
	calcHeatRejectionSystem();
	calcFinalTotals();
	warnings();
	drawCharts();
}

function warnings() {
	// TODO: Setup ability for multiple warnings / errors
	const remainingVolumeForCrew =
		Math.abs(results.structure.totals.volume) - results.totals.volume;
	if (remainingVolumeForCrew < 0) {
		error = 'Too little volume to fit equipment';
	} else {
		error = '';
	}
}

function round(num: number, decimals: number) {
	const multiple = Math.pow(10, decimals);

	// https://stackoverflow.com/a/11832950
	return Math.round((num + Number.EPSILON) * multiple) / multiple;
}

function roundTwo(num: number) {
	return round(num, 2);
}

function minimumValue(value: number) {
	return !value || value < 0 ? 0 : value;
}

function timeConvert(num: number) {
	const sec = num * 3600; // convert value to number if it's string
	const hours = Math.floor(sec / 3600); // get hours
	const minutes = Math.floor((sec - hours * 3600) / 60); // get minutes
	const seconds = Math.ceil(sec - hours * 3600 - minutes * 60); //  get seconds

	const stringHours = hours < 10 ? '0' + hours : hours;
	const stringMinutes = minutes < 10 ? '0' + minutes : minutes;
	const stringSeconds = seconds < 10 ? '0' + seconds : seconds;

	return stringHours + ':' + stringMinutes + ':' + stringSeconds;
}

/**
 *
 *
 * DRAW / CHART METHODS
 *
 *
 */

function drawCharts() {
	// if (resizeTimeout) clearTimeout(resizeTimeout);

	// resizeTimeout = setTimeout(() => {
	if (currentResultTab.value == 'results') {
		drawTotalsChart();
	} else if (currentResultTab.value == 'crew') {
		drawCrewCommitments();
	} else {
		drawTotalsChart();
	}
	//}, 500);
}
function drawTotalsChart() {
	if (!GoogleCharts.api.visualization) return;

	const data = GoogleCharts.api.visualization.arrayToDataTable([
		[
			'Totals',
			'Structure',
			'Avionics System',
			'ECLSS Systems',
			'Payload Systems',
			'Addional Biomass',
			'Power System',
			'Heat Rejection System',
			{ role: 'annotation' },
		],
		[
			'Mass (kg)',
			results.structure.totals.mass,
			results.avionics.mass,
			results.eclss.totals.mass,
			results.payload.mass,
			results.addBiomass.mass,
			results.power.totals.mass,
			results.heat.mass,
			'',
		],
		[
			'Mass - ISRU (kg)',
			results.structure.totals.massISRU,
			results.avionics.massISRU,
			results.eclss.totals.massISRU,
			results.payload.massISRU,
			results.addBiomass.massISRU,
			results.power.totals.massISRU,
			results.heat.massISRU,
			'',
		],
		[
			'Max Power (W)',
			results.structure.totals.power,
			results.avionics.power,
			results.eclss.totals.power,
			results.payload.power,
			results.addBiomass.power,
			results.power.totals.power,
			results.heat.power,
			'',
		],
		[
			'Pressurized volume',
			0,
			results.avionics.volume,
			results.eclss.totals.volume,
			results.payload.volume,
			results.addBiomass.volume,
			results.power.totals.volume,
			results.heat.volume,
			'',
		],
	]);

	const view = new GoogleCharts.api.visualization.DataView(data);

	const options = {
		chartArea: {
			// leave room for y-axis labels
			width: '80%',
		},
		isStacked: 'percent',
		height: 400,
		legend: { position: 'top', maxLines: 3 },
		vAxis: {
			minValue: 0,
			ticks: [0, 0.25, 0.5, 0.75, 1],
		},
	};

	resultsChartHTML.draw(view, options);
}
function drawCrewCommitments() {
	if (!GoogleCharts.api.visualization) return;

	const data = GoogleCharts.api.visualization.arrayToDataTable([
		[
			'Subsystem',
			'Air',
			'Food',
			'Thermal',
			'Waste',
			'Water',
			'EVA',
			'Human factors',
			'Biomass',
			{ role: 'annotation' },
		],
		[
			'Crew Commitments',
			crewResults.air.mission,
			crewResults.food.mission,
			crewResults.thermal.mission,
			crewResults.waste.mission,
			crewResults.water.mission,
			crewResults.eva.mission,
			crewResults.human.mission,
			crewResults.biomass.mission,
			'',
		],
	]);

	const view = new GoogleCharts.api.visualization.DataView(data);

	const options = {
		chartArea: {
			// leave room for y-axis labels
			width: '80%',
		},
		isStacked: 'percent',
		height: 400,
		legend: { position: 'top', maxLines: 3 },
		vAxis: {
			minValue: 0,
			ticks: [0, 0.25, 0.5, 0.75, 1],
		},
	};

	crewChartHTML.draw(view, options);
}

/**
 *
 *
 * UPDATE HANDLERS
 *
 *
 */
function updateMission() {
	// Set our location options to false when unavailable
	if (!isRegolithAvailable.value) {
		formData.value.mission.shielding = false;
		formData.value.mission.growing = false;
	}

	if (!isCO2Available.value) {
		formData.value.mission.atmosphere = false;
	}

	formData.value.mission.crew = minimumValue(formData.value.mission.crew);
	formData.value.mission.duration = minimumValue(
		formData.value.mission.duration,
	);
	formData.value.mission.mass = minimumValue(formData.value.mission.mass);
	formData.value.mission.volume = minimumValue(formData.value.mission.volume);
	formData.value.mission.power = minimumValue(formData.value.mission.power);

	calcResults();
}

function updateStructure() {
	formData.value.structure.volume = minimumValue(
		formData.value.structure.volume,
	);
	formData.value.structure.radiation = minimumValue(
		formData.value.structure.radiation,
	);

	calcResults();
}

function updateEvaHours() {
	formData.value.support.evaHours = minimumValue(
		formData.value.support.evaHours,
	);

	calcResults();
}

function updateElectrical() {
	formData.value.electrical.primaryElements = minimumValue(
		formData.value.electrical.primaryElements,
	);
	formData.value.electrical.storage = minimumValue(
		formData.value.electrical.storage,
	);
	formData.value.electrical.fuelCellStorage = minimumValue(
		formData.value.electrical.fuelCellStorage,
	);

	calcResults();
}

// watch(formData, (newValue, oldValue) => {
// 	nextTick(() => {
// 		calcResults();
// 		drawCharts();
// 	});
// });
</script>

<style></style>
