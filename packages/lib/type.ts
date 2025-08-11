export interface githubFile{
    folderstructure:{
        path:string,
        mode:string,
        type:'blob'|'tree'|'commit',
        size:number,
        sha:string,
        url:string,
    }
}
export interface Dependency {
    name: string;
    version: string;
    type: 'dependency' | 'devDependency';
}

export interface RepoData {
    name:string;
    description:string;
    language:Record<string, number>;
    stars:number;
    forks:number;
    url:string;
    updated_at:string;
    created_at:string;
    dependencies?: Dependency[];
}
export interface commit{
    commit:{
        author:{
            name:string,
            email:string,
            date:string,
        },
        message:string,
        tree:{
            sha:string,
            url:string,
        },
        comment_count:number,
    }
}