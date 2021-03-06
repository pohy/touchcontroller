// TODO: To library

export class SourceCache<TId, TSource> {
    private storage: Array<{ id: TId; source: TSource }> = [];

    public hasItem(id: TId) {
        return this.storage.some((item) => item.id === id);
    }

    public getItem(id: TId): TSource | null {
        return (this.storage.find((item) => item.id === id) || { source: null })
            .source;
    }

    public setItem(id: TId, source: TSource) {
        return this.storage.push({ id, source });
    }
}
