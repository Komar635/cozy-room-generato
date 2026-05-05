"use client";

import { useCallback, useState } from "react";
import {
	DEFAULT_ORBIT_STATE,
	type OrbitViewState,
	syncOrbitViewState,
} from "./comparisonSync";
import Model3DViewer from "./Model3DViewer";

interface ComparisonModel {
	id: string;
	parent_model_id?: string;
	model_type: "gaussian-splatting" | "nerf";
	storage_path: string;
	url: string;
	is_original: boolean;
	created_at: string;
}

interface ComparisonViewProps {
	leftModel: ComparisonModel;
	rightModel: ComparisonModel;
	onError?: (error: Error) => void;
}

const panelTitleClasses = "text-xs uppercase tracking-[0.22em] text-slate-400";

export default function ComparisonView({
	leftModel,
	rightModel,
	onError,
}: ComparisonViewProps) {
	const [orbitState, setOrbitState] =
		useState<OrbitViewState>(DEFAULT_ORBIT_STATE);

	const handleOrbitChange = useCallback((nextState: OrbitViewState) => {
		setOrbitState(syncOrbitViewState(nextState));
	}, []);

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{[
				{ label: "Слева", model: leftModel },
				{ label: "Справа", model: rightModel },
			].map(({ label, model }) => (
				<article
					key={`${label}-${model.id}`}
					className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-inner"
				>
					<div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-white">
						<div>
							<p className={panelTitleClasses}>{label}</p>
							<p className="mt-1 text-sm font-semibold text-slate-100">
								{model.is_original
									? "Оригинальная версия"
									: "Производная версия"}
							</p>
						</div>
						<div className="text-right text-xs text-slate-400">
							<p>{model.model_type}</p>
							<p className="mt-1">
								{new Date(model.created_at).toLocaleString("ru-RU")}
							</p>
						</div>
					</div>

					<div className="p-3">
						<Model3DViewer
							modelUrl={model.url}
							modelType={model.model_type}
							orbitState={orbitState}
							onOrbitChange={handleOrbitChange}
							onError={onError}
							className="h-[24rem] w-full"
						/>
					</div>

					<div className="grid gap-3 border-t border-slate-800 px-4 py-4 text-xs text-slate-300 sm:grid-cols-3">
						<div>
							<p className={panelTitleClasses}>ID модели</p>
							<p className="mt-2 truncate text-sm text-slate-100">{model.id}</p>
						</div>
						<div>
							<p className={panelTitleClasses}>Родитель</p>
							<p className="mt-2 truncate text-sm text-slate-100">
								{model.parent_model_id || "Нет"}
							</p>
						</div>
						<div>
							<p className={panelTitleClasses}>Источник</p>
							<p className="mt-2 truncate text-sm text-slate-100">
								{model.storage_path}
							</p>
						</div>
					</div>
				</article>
			))}
		</div>
	);
}
