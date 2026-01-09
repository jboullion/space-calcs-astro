import { useSRM } from './SRMContext';
import { useState } from 'react';
import InputWrapper from '../forms/InputWrapper';
import NumberInput from '../forms/NumberInput';
import type { GrainSegment } from './types';

export default function GrainStackBuilder() {
	const { config, updateGrainStack } = useSRM();
	const [collapsedSegments, setCollapsedSegments] = useState<Set<string>>(new Set());

	const toggleCollapse = (id: string) => {
		const newCollapsed = new Set(collapsedSegments);
		if (newCollapsed.has(id)) {
			newCollapsed.delete(id);
		} else {
			newCollapsed.add(id);
		}
		setCollapsedSegments(newCollapsed);
	};

	const addSegment = (type: 'bates' | 'finocyl') => {
		const newSegment: GrainSegment = {
			id: `segment-${Date.now()}`,
			type,
			length: 0.1524, // 152.4mm (6 inches)
			outerRadius: 0.0254, // 25.4mm (1 inch)
			innerRadius: 0.0127, // 12.7mm (0.5 inch)
			inhibitEnds: true,
			...(type === 'finocyl' && {
				finCount: 6,
				finDepth: 0.006, // 6mm
				finThickness: 0.004, // 4mm
			}),
		};
		updateGrainStack([...config.grainStack, newSegment]);
		// Add new segment to collapsed state
		setCollapsedSegments(prev => new Set([...prev, newSegment.id]));
	};

	const removeSegment = (id: string) => {
		updateGrainStack(config.grainStack.filter((s) => s.id !== id));
	};

	const updateSegment = (id: string, updates: Partial<GrainSegment>) => {
		updateGrainStack(
			config.grainStack.map((s) =>
				s.id === id ? { ...s, ...updates } : s,
			),
		);
	};

	const moveSegment = (index: number, direction: 'up' | 'down') => {
		const newStack = [...config.grainStack];
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= newStack.length) return;
		[newStack[index], newStack[newIndex]] = [
			newStack[newIndex],
			newStack[index],
		];
		updateGrainStack(newStack);
	};

	return (
		<div className="p-3 rounded border mb-3">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h5 className="mb-0">Grain Stack</h5>
				<div className="btn-group">
					<button
						className="btn btn-sm btn-outline-primary"
						onClick={() => addSegment('bates')}
						title="Add BATES grain segment"
					>
						<i className="fas fa-plus me-1"></i>BATES
					</button>
					<button
						className="btn btn-sm btn-outline-primary"
						onClick={() => addSegment('finocyl')}
						title="Add Finocyl grain segment"
					>
						<i className="fas fa-plus me-1"></i>Finocyl
					</button>
				</div>
			</div>

			{config.grainStack.length === 0 && (
				<div className="text-center py-4 text-muted">
					<i className="fas fa-box-open fa-2x mb-2"></i>
					<p className="mb-0">
						No grain segments. Click "+ BATES" or "+ Finocyl" to
						add.
					</p>
				</div>
			)}

			<div className="grain-stack">
				{config.grainStack.map((segment, index) => {
					const isCollapsed = collapsedSegments.has(segment.id);
					return (
					<div key={segment.id} className="card mb-2">
						<div className="card-header d-flex justify-content-between align-items-center">
							<div className="d-flex align-items-center gap-2">
								<button
									className="btn btn-sm btn-link p-0 text-decoration-none"
									onClick={() => toggleCollapse(segment.id)}
									title={isCollapsed ? "Expand" : "Collapse"}
								>
									<i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'} me-2`}></i>
								</button>
								<strong>
									{segment.type.toUpperCase()} #{index + 1}
								</strong>
								<span className="badge bg-secondary">
									{(segment.length * 1000).toFixed(1)}mm
								</span>
							</div>
							<div className="btn-group btn-group-sm">
								<button
									className="btn btn-outline-secondary"
									onClick={() => moveSegment(index, 'up')}
									disabled={index === 0}
									title="Move up"
								>
									<i className="fas fa-arrow-up"></i>
								</button>
								<button
									className="btn btn-outline-secondary"
									onClick={() => moveSegment(index, 'down')}
									disabled={
										index === config.grainStack.length - 1
									}
									title="Move down"
								>
									<i className="fas fa-arrow-down"></i>
								</button>
								<button
									className="btn btn-outline-danger"
									onClick={() => removeSegment(segment.id)}
									title="Remove segment"
								>
									<i className="fas fa-trash"></i>
								</button>
							</div>
						</div>
						{!isCollapsed && (
						<div className="card-body">
							<InputWrapper
								id={`length-${segment.id}`}
								label="Length"
								input={
									<NumberInput
										id={`length-${segment.id}`}
										value={segment.length * 1000}
										min={10}
										max={1000}
										step={1}
										onChange={(val) =>
											updateSegment(segment.id, {
												length: val / 1000,
											})
										}
									/>
								}
								unit={
									<span className="input-group-text">
										mm
									</span>
								}
							/>

							<InputWrapper
								id={`outer-radius-${segment.id}`}
								label="Outer Radius (R<sub>o</sub>)"
								input={
									<NumberInput
										id={`outer-radius-${segment.id}`}
										value={segment.outerRadius * 1000}
										min={1}
										max={500}
										step={0.1}
										onChange={(val) =>
											updateSegment(segment.id, {
												outerRadius: val / 1000,
											})
										}
									/>
								}
								unit={
									<span className="input-group-text">
										mm
									</span>
								}
							/>

							<InputWrapper
								id={`inner-radius-${segment.id}`}
								label="Inner Radius (R<sub>i</sub>)"
								input={
									<NumberInput
										id={`inner-radius-${segment.id}`}
										value={segment.innerRadius * 1000}
										min={0}
										max={500}
										step={0.1}
										onChange={(val) =>
											updateSegment(segment.id, {
												innerRadius: val / 1000,
											})
										}
									/>
								}
								unit={
									<span className="input-group-text">
										mm
									</span>
								}
							/>

							{segment.type === 'finocyl' && (
								<>
									<InputWrapper
										id={`fin-count-${segment.id}`}
										label="Number of Fins"
										input={
											<NumberInput
												id={`fin-count-${segment.id}`}
												value={segment.finCount || 6}
												min={3}
												max={16}
												step={1}
												onChange={(val) =>
													updateSegment(segment.id, {
														finCount: val,
													})
												}
											/>
										}
									/>

									<InputWrapper
										id={`fin-depth-${segment.id}`}
										label="Fin Depth"
										input={
											<NumberInput
												id={`fin-depth-${segment.id}`}
												value={
													(segment.finDepth || 0.006) *
													1000
												}
												min={0.1}
												max={50}
												step={0.1}
												onChange={(val) =>
													updateSegment(segment.id, {
														finDepth: val / 1000,
													})
												}
											/>
										}
										unit={
											<span className="input-group-text">
												mm
											</span>
										}
									/>

									<InputWrapper
										id={`fin-thickness-${segment.id}`}
										label="Fin Thickness"
										input={
											<NumberInput
												id={`fin-thickness-${segment.id}`}
												value={
													(segment.finThickness ||
														0.004) * 1000
												}
												min={0.1}
												max={20}
												step={0.1}
												onChange={(val) =>
													updateSegment(segment.id, {
														finThickness:
															val / 1000,
													})
												}
											/>
										}
										unit={
											<span className="input-group-text">
												mm
											</span>
										}
									/>
								</>
							)}

							<div className="form-check form-switch mb-0">
								<input
									className="form-check-input"
									type="checkbox"
									id={`inhibit-${segment.id}`}
									checked={segment.inhibitEnds}
									onChange={(e) =>
										updateSegment(segment.id, {
											inhibitEnds: e.target.checked,
										})
									}
								/>
								<label
									className="form-check-label"
									htmlFor={`inhibit-${segment.id}`}
								>
									Inhibit Ends
								</label>
							</div>
						</div>
						)}
					</div>
					);
				})}
			</div>
		</div>
	);
}
