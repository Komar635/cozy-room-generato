"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";

interface MaterialSpecItem {
	name: string;
	brand: string;
	code: string;
	quantity: string;
	applicationArea?: string;
	application_area?: string;
	finish?: string;
	notes?: string;
}

interface MaterialSpecResponse {
	id: string;
	modificationId: string;
	materials: MaterialSpecItem[];
	instructions?: string | null;
	estimatedCoverage?: string;
	safetyNotes?: string[];
	createdAt: string;
}

interface MaterialSpecificationProps {
	modificationId: string | null;
}

export function MaterialSpecification({
	modificationId,
}: MaterialSpecificationProps) {
	const printRootId = useId().replace(/:/g, "-");
	const [spec, setSpec] = useState<MaterialSpecResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!modificationId) {
			setSpec(null);
			setError(null);
			return;
		}

		let ignore = false;

		async function fetchSpec() {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`/api/modifications/${modificationId}/spec`,
					{
						cache: "no-store",
					},
				);
				const payload = await response.json().catch(() => null);

				if (!response.ok) {
					throw new Error(
						payload?.message ||
							payload?.error ||
							"Не удалось получить спецификацию материалов",
					);
				}

				if (!ignore) {
					setSpec(payload);
				}
			} catch (requestError) {
				if (!ignore) {
					setError(
						requestError instanceof Error
							? requestError.message
							: "Не удалось получить спецификацию материалов",
					);
				}
			} finally {
				if (!ignore) {
					setLoading(false);
				}
			}
		}

		fetchSpec();

		return () => {
			ignore = true;
		};
	}, [modificationId]);

	const handlePrint = () => {
		window.print();
	};

	if (!modificationId) {
		return (
			<section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-500">
				Спецификация появится после применения модификации к модели.
			</section>
		);
	}

	if (loading) {
		return (
			<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-sm font-medium text-slate-900">
					Готовлю спецификацию материалов...
				</p>
				<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
					<div className="h-full w-1/2 animate-pulse rounded-full bg-slate-700" />
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
				<p className="font-medium">Спецификация недоступна</p>
				<p className="mt-2">{error}</p>
			</section>
		);
	}

	if (!spec) {
		return null;
	}

	return (
		<section
			id={printRootId}
			className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none"
		>
			<style>{`@media print { body * { visibility: hidden; } #${printRootId}, #${printRootId} * { visibility: visible; } #${printRootId} { position: absolute; inset: 0; width: 100%; border: 0; } .no-print { display: none !important; } }`}</style>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.24em] text-slate-400">
						Material spec
					</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
						Спецификация материалов
					</h2>
					<p className="mt-2 text-sm text-slate-500">
						Сформирована {new Date(spec.createdAt).toLocaleString("ru-RU")}
					</p>
				</div>
				<Button className="no-print" onClick={handlePrint} variant="outline">
					Экспорт в PDF
				</Button>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				{spec.materials.map((material) => (
					<article
						key={`${material.brand}-${material.code}`}
						className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-base font-semibold text-slate-900">
									{material.name}
								</h3>
								<p className="text-sm text-slate-500">
									{material.brand} - {material.code}
								</p>
							</div>
							<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
								{material.quantity}
							</span>
						</div>
						<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<dt className="text-slate-400">Зона применения</dt>
								<dd className="font-medium text-slate-800">
									{material.applicationArea || material.application_area}
								</dd>
							</div>
							{material.finish && (
								<div>
									<dt className="text-slate-400">Финиш</dt>
									<dd className="font-medium text-slate-800">
										{material.finish}
									</dd>
								</div>
							)}
						</dl>
						{material.notes && (
							<p className="mt-3 text-sm text-slate-600">{material.notes}</p>
						)}
					</article>
				))}
			</div>

			<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
				<h3 className="text-sm font-semibold text-amber-950">
					Инструкции по применению
				</h3>
				<p className="mt-2 text-sm leading-6 text-amber-900">
					{spec.instructions}
				</p>
				{spec.estimatedCoverage && (
					<p className="mt-3 text-sm font-medium text-amber-950">
						Расчет покрытия: {spec.estimatedCoverage}
					</p>
				)}
			</div>

			{spec.safetyNotes && spec.safetyNotes.length > 0 && (
				<ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
					{spec.safetyNotes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			)}
		</section>
	);
}
