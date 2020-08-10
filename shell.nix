{ pkgs ? import <nixpkgs> {} }:
pkgs.callPackage ./default.nix {
  yarn2nix = pkgs.yarn2nix-moretea;
  texlive = pkgs.texlive;
}

