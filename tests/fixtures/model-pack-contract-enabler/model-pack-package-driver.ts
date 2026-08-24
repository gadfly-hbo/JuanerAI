import assert from 'node:assert/strict';
import type { ArtifactObservationV1, CategoryDemandForecastV1, CategoryDemandInputV1 } from '../../../packages/contracts/model-pack.ts';

import { artifactObservationFixture, canonicalBytes, clone, deepFreeze, forecastFixture, inputFixture, manifestFixture } from './model-pack-fixtures.ts';

export type ModelPackPackageDriver = Readonly<{
  observeInstalledPackage(): Promise<Readonly<{
    manifest_bytes: Uint8Array;
    artifact: ArtifactObservationV1;
  }>>;
  predict(input: CategoryDemandInputV1): Promise<CategoryDemandForecastV1>;
}>;

export async function runModelPackPackageContract(
  createDriver: () => Promise<ModelPackPackageDriver>,
): Promise<void> {
  const driver = await createDriver();
  assert.deepEqual(Object.keys(driver), ['observeInstalledPackage', 'predict']);

  const expectedBytes = canonicalBytes(manifestFixture());
  const firstObservation = await driver.observeInstalledPackage();
  assert.deepEqual(Object.keys(firstObservation), ['manifest_bytes', 'artifact']);
  assert.ok(firstObservation.manifest_bytes instanceof Uint8Array);
  assert.deepEqual(firstObservation.manifest_bytes, expectedBytes);
  assert.deepEqual(firstObservation.artifact, artifactObservationFixture());

  firstObservation.manifest_bytes[0] = 0;
  const secondObservation = await driver.observeInstalledPackage();
  assert.notEqual(secondObservation.manifest_bytes, firstObservation.manifest_bytes);
  assert.notEqual(secondObservation.artifact, firstObservation.artifact);
  assert.deepEqual(secondObservation.manifest_bytes, expectedBytes, 'observation returns defensive canonical bytes');
  assert.deepEqual(secondObservation.artifact, artifactObservationFixture(), 'observation returns detached exact Artifact evidence');

  const firstForecast = await driver.predict(inputFixture() as CategoryDemandInputV1);
  assert.deepEqual(Object.keys(firstForecast), ['contract_version', 'as_of_date', 'currency', 'predictions']);
  assert.deepEqual(firstForecast, forecastFixture(inputFixture()));
  const secondForecast = await driver.predict(inputFixture() as CategoryDemandInputV1);
  assert.notEqual(secondForecast, firstForecast);
  assert.deepEqual(secondForecast, firstForecast, 'repeated prediction is value-deterministic');
}

export function createDeterministicModelPackPackageDriver(): ModelPackPackageDriver {
  return Object.freeze({
    async observeInstalledPackage() {
      return Object.freeze({
        manifest_bytes: canonicalBytes(manifestFixture()),
        artifact: deepFreeze(clone(artifactObservationFixture())) as ArtifactObservationV1,
      });
    },
    async predict(input: CategoryDemandInputV1) {
      return deepFreeze(clone(forecastFixture(input as unknown as Record<string, unknown>))) as CategoryDemandForecastV1;
    },
  });
}
