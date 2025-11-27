/**
 * Compare only the release configuration within configValue.release
 */
export function compareReleaseConfig(jsonA: any, jsonB: any) {
    const releaseA = jsonA?.configValue?.release || {};
    const releaseB = jsonB?.configValue?.release || {};

    return {
        releaseA,
        releaseB
    };
}
